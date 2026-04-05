import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TalentApplication {
  id: string;
  job_posting_id: string;
  job_title: string;
  job_status: string;
  triage_status: string;
  status: string;
  created_at: string;
  resume_url: string | null;
  resume_filename: string | null;
  form_data: Record<string, any>;
}

export interface TalentProfile {
  email: string;
  name: string;
  phone: string | null;
  applications: TalentApplication[];
  latestApplication: TalentApplication;
  totalApplications: number;
  latestResumeUrl: string | null;
  latestResumeFilename: string | null;
}

export function useTalentPool(userId?: string) {
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [jobOptions, setJobOptions] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchTalents();
  }, [userId]);

  const fetchTalents = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Fetch all job postings for this user
      const { data: jobs, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, title, status')
        .eq('user_id', userId);

      if (jobsError) throw jobsError;
      if (!jobs || jobs.length === 0) {
        setTalents([]);
        setLoading(false);
        return;
      }

      setJobOptions(jobs.map(j => ({ id: j.id, title: j.title })));

      const jobIds = jobs.map(j => j.id);
      const jobMap = new Map(jobs.map(j => [j.id, { title: j.title, status: j.status }]));

      // Fetch all applications for these jobs
      const { data: applications, error: appsError } = await supabase
        .from('job_applications')
        .select('*')
        .in('job_posting_id', jobIds)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Group by email
      const talentMap = new Map<string, TalentApplication[]>();
      
      for (const app of applications || []) {
        const email = (app.applicant_email || '').toLowerCase().trim();
        if (!email) continue;

        const jobInfo = jobMap.get(app.job_posting_id);
        const talentApp: TalentApplication = {
          id: app.id,
          job_posting_id: app.job_posting_id,
          job_title: jobInfo?.title || 'Vaga removida',
          job_status: jobInfo?.status || 'unknown',
          triage_status: app.triage_status,
          status: app.status,
          created_at: app.created_at,
          resume_url: app.resume_url,
          resume_filename: app.resume_filename,
          form_data: (app.form_data as Record<string, any>) || {},
        };

        if (!talentMap.has(email)) {
          talentMap.set(email, []);
        }
        talentMap.get(email)!.push(talentApp);
      }

      // Build talent profiles
      const talentProfiles: TalentProfile[] = [];
      
      for (const [email, apps] of talentMap.entries()) {
        // Already sorted desc by created_at
        const latest = apps[0];
        const name = apps.find(a => {
          const fd = a.form_data;
          return fd?.['Nome completo'] || fd?.['nome_completo'] || fd?.['name'];
        })?.form_data;
        
        const displayName = latest.form_data?.['Nome completo'] 
          || latest.form_data?.['nome_completo']
          || latest.form_data?.['name']
          || (applications?.find(a => (a.applicant_email || '').toLowerCase().trim() === email)?.applicant_name)
          || email.split('@')[0];

        const phone = latest.form_data?.['Telefone'] 
          || latest.form_data?.['telefone']
          || latest.form_data?.['phone']
          || null;

        // Find latest resume
        const withResume = apps.find(a => a.resume_url);

        talentProfiles.push({
          email,
          name: displayName,
          phone,
          applications: apps,
          latestApplication: latest,
          totalApplications: apps.length,
          latestResumeUrl: withResume?.resume_url || null,
          latestResumeFilename: withResume?.resume_filename || null,
        });
      }

      // Sort by latest application date
      talentProfiles.sort((a, b) => 
        new Date(b.latestApplication.created_at).getTime() - new Date(a.latestApplication.created_at).getTime()
      );

      setTalents(talentProfiles);
    } catch (error) {
      console.error('Error fetching talent pool:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter talents
  const filteredTalents = talents.filter(t => {
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJob = jobFilter === 'all' || 
      t.applications.some(a => a.job_posting_id === jobFilter);

    return matchesSearch && matchesJob;
  });

  return {
    talents: filteredTalents,
    totalTalents: talents.length,
    loading,
    searchQuery,
    setSearchQuery,
    jobFilter,
    setJobFilter,
    jobOptions,
    refresh: fetchTalents,
  };
}
