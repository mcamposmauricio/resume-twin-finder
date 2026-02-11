import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JobTemplate {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  work_type: string | null;
  location: string | null;
  created_at: string;
}

export function useJobTemplates() {
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_templates')
        .select('*')
        .order('title');

      if (!error && data) {
        setTemplates(data as JobTemplate[]);
      }
      setLoading(false);
    };

    fetchTemplates();
  }, []);

  return { templates, loading };
}
