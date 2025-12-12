-- Create analysis_jobs table for async processing
CREATE TABLE public.analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  progress integer NOT NULL DEFAULT 0,
  current_step text,
  result jsonb,
  error_message text,
  files_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own analysis jobs"
ON public.analysis_jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can insert own analysis jobs"
ON public.analysis_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow updates via service role (for background processing)
CREATE POLICY "Allow all updates for analysis jobs"
ON public.analysis_jobs
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_analysis_jobs_updated_at
BEFORE UPDATE ON public.analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();