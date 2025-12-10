-- Add total_resumes field to profiles table with default of 10 resumes
ALTER TABLE public.profiles 
ADD COLUMN total_resumes INTEGER NOT NULL DEFAULT 10;

-- Add a comment explaining the field
COMMENT ON COLUMN public.profiles.total_resumes IS 'Total number of resumes available for the user to analyze';