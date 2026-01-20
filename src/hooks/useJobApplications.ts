import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication, ApplicationStatus } from '@/types/jobs';
import { useToast } from '@/hooks/use-toast';

export function useJobApplications(jobPostingId?: string) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    if (!jobPostingId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_posting_id', jobPostingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const parsed: JobApplication[] = (data || []).map(a => ({
        ...a,
        form_data: (a.form_data as Record<string, any>) || {},
        status: a.status as ApplicationStatus,
      }));
      setApplications(parsed);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Erro ao carregar candidaturas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [jobPostingId, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const createApplication = async (
    data: Omit<JobApplication, 'id' | 'created_at' | 'status' | 'analysis_id'>
  ): Promise<JobApplication | null> => {
    try {
      const { data: newApp, error } = await supabase
        .from('job_applications')
        .insert([{
          job_posting_id: data.job_posting_id,
          form_data: data.form_data,
          resume_url: data.resume_url,
          resume_filename: data.resume_filename,
          applicant_email: data.applicant_email,
          applicant_name: data.applicant_name,
        }])
        .select()
        .single();

      if (error) throw error;
      const result: JobApplication = {
        id: newApp.id,
        job_posting_id: newApp.job_posting_id,
        form_data: typeof newApp.form_data === 'object' && newApp.form_data !== null && !Array.isArray(newApp.form_data)
          ? (newApp.form_data as Record<string, any>)
          : {},
        resume_url: newApp.resume_url || undefined,
        resume_filename: newApp.resume_filename || undefined,
        applicant_email: newApp.applicant_email || undefined,
        applicant_name: newApp.applicant_name || undefined,
        status: newApp.status as ApplicationStatus,
        analysis_id: newApp.analysis_id || undefined,
        created_at: newApp.created_at,
      };
      return result;
    } catch (error: any) {
      console.error('Error creating application:', error);
      toast({
        title: 'Erro ao enviar candidatura',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateApplicationStatus = async (
    id: string,
    status: ApplicationStatus
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setApplications(prev =>
        prev.map(a => (a.id === id ? { ...a, status } : a))
      );
      return true;
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const linkToAnalysis = async (
    applicationIds: string[],
    analysisId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ analysis_id: analysisId, status: 'analyzed' })
        .in('id', applicationIds);

      if (error) throw error;

      setApplications(prev =>
        prev.map(a =>
          applicationIds.includes(a.id)
            ? { ...a, analysis_id: analysisId, status: 'analyzed' as ApplicationStatus }
            : a
        )
      );
      toast({ title: 'Candidaturas vinculadas à análise!' });
      return true;
    } catch (error: any) {
      console.error('Error linking to analysis:', error);
      toast({
        title: 'Erro ao vincular à análise',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const uploadResume = async (
    jobPostingId: string,
    file: File
  ): Promise<string | null> => {
    try {
      const fileName = `${jobPostingId}/${crypto.randomUUID()}_${file.name}`;
      const { error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (error) throw error;
      return fileName;
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast({
        title: 'Erro ao enviar currículo',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const getResumeUrl = async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      console.error('Error getting resume URL:', error);
      return null;
    }
  };

  const downloadResume = async (path: string): Promise<Blob | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(path);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error downloading resume:', error);
      return null;
    }
  };

  return {
    applications,
    loading,
    createApplication,
    updateApplicationStatus,
    linkToAnalysis,
    uploadResume,
    getResumeUrl,
    downloadResume,
    refetch: fetchApplications,
  };
}
