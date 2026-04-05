import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TalentPoolRow {
  email: string;
  name: string;
  phone: string | null;
  total_applications: number;
  latest_date: string;
  latest_job_title: string;
  latest_job_posting_id: string;
  latest_triage: string;
  latest_status: string;
  has_resume: boolean;
  latest_resume_url: string | null;
  latest_resume_filename: string | null;
  score: number;
  total_count: number;
}

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
  form_fields: Array<{ id: string; label: string; [key: string]: any }> | null;
}

export interface TalentFilters {
  search: string;
  jobIds: string[];
  triageStatus: string;
  hasResume: boolean | null;
  minApplications: number | null;
  dateFrom: string | null;
}

const DEFAULT_FILTERS: TalentFilters = {
  search: '',
  jobIds: [],
  triageStatus: '',
  hasResume: null,
  minApplications: null,
  dateFrom: null,
};

export function useTalentPool(userId?: string) {
  const [talents, setTalents] = useState<TalentPoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TalentFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [jobOptions, setJobOptions] = useState<{ id: string; title: string }[]>([]);
  const pageSize = 50;

  // Fetch job options once
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('job_postings')
      .select('id, title')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setJobOptions(data.map(j => ({ id: j.id, title: j.title })));
      });
  }, [userId]);

  const fetchTalents = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_talent_pool', {
        p_user_id: userId,
        p_page: page,
        p_page_size: pageSize,
        p_search: filters.search || undefined,
        p_job_ids: filters.jobIds.length > 0 ? filters.jobIds : undefined,
        p_triage_status: filters.triageStatus || undefined,
        p_has_resume: filters.hasResume ?? undefined,
        p_min_applications: filters.minApplications ?? undefined,
        p_date_from: filters.dateFrom ?? undefined,
      });

      if (error) throw error;

      const rows = (data || []) as unknown as TalentPoolRow[];
      setTalents(rows);
      setTotalCount(rows.length > 0 ? rows[0].total_count : 0);
    } catch (error) {
      console.error('Error fetching talent pool:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filters, page]);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const updateFilter = useCallback(<K extends keyof TalentFilters>(key: K, value: TalentFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    talents,
    totalCount,
    loading,
    filters,
    updateFilter,
    setFilters,
    page,
    setPage,
    totalPages,
    pageSize,
    jobOptions,
    refresh: fetchTalents,
  };
}

export function useTalentDetail(userId?: string) {
  const [applications, setApplications] = useState<TalentApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async (email: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_talent_applications', {
        p_user_id: userId,
        p_email: email,
      });
      if (error) throw error;
      setApplications((data || []) as unknown as TalentApplication[]);
    } catch (error) {
      console.error('Error fetching talent detail:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { applications, loading, fetchDetail };
}
