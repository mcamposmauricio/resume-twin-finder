-- Add analyzed_at column to track when a job was sent to analysis
ALTER TABLE public.job_postings 
ADD COLUMN analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;