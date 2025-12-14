-- Add duration_seconds field to track analysis time
ALTER TABLE public.analysis_jobs 
ADD COLUMN duration_seconds integer DEFAULT NULL;

-- Add duration_seconds to analyses table as well for completed analyses
ALTER TABLE public.analyses 
ADD COLUMN duration_seconds integer DEFAULT NULL;