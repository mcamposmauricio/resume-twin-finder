import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobPosting, JobStatus, FormField, WorkType } from '@/types/jobs';
import { useToast } from '@/hooks/use-toast';

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useJobPostings(userId?: string) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobPostings = useCallback(async () => {
    if (!userId) {
      setJobPostings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          form_template:form_templates(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get application counts
      const jobIds = (data || []).map(j => j.id);
      let applicationCounts: Record<string, number> = {};
      let analysisIds: Record<string, string> = {};
      
      if (jobIds.length > 0) {
        const { data: countData } = await supabase
          .from('job_applications')
          .select('job_posting_id')
          .in('job_posting_id', jobIds);
        
        if (countData) {
          applicationCounts = countData.reduce((acc, app) => {
            acc[app.job_posting_id] = (acc[app.job_posting_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }

        // Get analysis IDs for analyzed jobs
        const { data: analysisData } = await supabase
          .from('analyses')
          .select('id, job_posting_id')
          .in('job_posting_id', jobIds);
        
        if (analysisData) {
          analysisIds = analysisData.reduce((acc, analysis) => {
            if (analysis.job_posting_id) {
              acc[analysis.job_posting_id] = analysis.id;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const parsed: JobPosting[] = (data || []).map(j => ({
        ...j,
        work_type: j.work_type as WorkType | undefined,
        status: j.status as JobStatus,
        form_template: j.form_template ? {
          ...j.form_template,
          fields: (j.form_template.fields as unknown as FormField[]) || [],
        } : undefined,
        applications_count: applicationCounts[j.id] || 0,
        analysis_id: analysisIds[j.id],
      }));

      setJobPostings(parsed);
    } catch (error: any) {
      console.error('Error fetching job postings:', error);
      toast({
        title: 'Erro ao carregar vagas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchJobPostings();
  }, [fetchJobPostings]);

  const createJobPosting = async (
    data: Omit<JobPosting, 'id' | 'user_id' | 'public_slug' | 'created_at' | 'updated_at' | 'applications_count'>
  ): Promise<JobPosting | null> => {
    if (!userId) return null;

    try {
      const { data: newJob, error } = await supabase
        .from('job_postings')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          location: data.location,
          salary_range: data.salary_range,
          work_type: data.work_type,
          form_template_id: data.form_template_id,
          status: data.status,
          public_slug: generateSlug(),
          expires_at: data.expires_at,
        })
        .select()
        .single();

      if (error) throw error;

      const jobPosting: JobPosting = { 
        ...newJob, 
        work_type: newJob.work_type as WorkType | undefined,
        status: newJob.status as JobStatus,
        applications_count: 0 
      };
      setJobPostings(prev => [jobPosting, ...prev]);
      toast({ title: 'Vaga criada com sucesso!' });
      return jobPosting;
    } catch (error: any) {
      console.error('Error creating job posting:', error);
      toast({
        title: 'Erro ao criar vaga',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateJobPosting = async (
    id: string,
    updates: Partial<Omit<JobPosting, 'id' | 'user_id' | 'public_slug' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setJobPostings(prev =>
        prev.map(j => (j.id === id ? { ...j, ...updates } : j))
      );
      toast({ title: 'Vaga atualizada com sucesso!' });
      return true;
    } catch (error: any) {
      console.error('Error updating job posting:', error);
      toast({
        title: 'Erro ao atualizar vaga',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteJobPosting = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobPostings(prev => prev.filter(j => j.id !== id));
      toast({ title: 'Vaga excluída com sucesso!' });
      return true;
    } catch (error: any) {
      console.error('Error deleting job posting:', error);
      toast({
        title: 'Erro ao excluir vaga',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const changeStatus = async (id: string, status: JobStatus): Promise<boolean> => {
    const updates: Partial<JobPosting> = { status };
    if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }
    return updateJobPosting(id, updates);
  };

  const getJobBySlug = async (slug: string): Promise<JobPosting | null> => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          form_template:form_templates(*)
        `)
        .eq('public_slug', slug)
        .single();

      if (error) throw error;

      return {
        ...data,
        work_type: data.work_type as WorkType | undefined,
        status: data.status as JobStatus,
        form_template: data.form_template ? {
          ...data.form_template,
          fields: (data.form_template.fields as unknown as FormField[]) || [],
        } : undefined,
      };
    } catch (error: any) {
      console.error('Error fetching job by slug:', error);
      return null;
    }
  };

  const getJobById = async (id: string): Promise<JobPosting | null> => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          form_template:form_templates(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get application count
      const { count } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_posting_id', id);

      return {
        ...data,
        work_type: data.work_type as WorkType | undefined,
        status: data.status as JobStatus,
        form_template: data.form_template ? {
          ...data.form_template,
          fields: (data.form_template.fields as unknown as FormField[]) || [],
        } : undefined,
        applications_count: count || 0,
      };
    } catch (error: any) {
      console.error('Error fetching job by id:', error);
      return null;
    }
  };

  return {
    jobPostings,
    loading,
    createJobPosting,
    updateJobPosting,
    deleteJobPosting,
    changeStatus,
    getJobBySlug,
    getJobById,
    refetch: fetchJobPostings,
  };
}
