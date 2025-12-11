-- Add optional job_title column to analyses table
ALTER TABLE public.analyses 
ADD COLUMN job_title TEXT;