-- Add job_posting_id column to analyses table to link analysis back to original job posting
ALTER TABLE public.analyses 
ADD COLUMN job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_analyses_job_posting_id ON public.analyses(job_posting_id);