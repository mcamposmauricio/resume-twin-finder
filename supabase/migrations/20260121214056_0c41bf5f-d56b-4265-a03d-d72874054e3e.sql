-- Add triage_status column to job_applications table
ALTER TABLE job_applications 
ADD COLUMN triage_status TEXT NOT NULL DEFAULT 'new';

-- Add check constraint for valid values
ALTER TABLE job_applications
ADD CONSTRAINT job_applications_triage_status_check 
CHECK (triage_status IN ('new', 'low_fit', 'deserves_analysis'));