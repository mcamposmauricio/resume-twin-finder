-- Add branding columns to job_postings
ALTER TABLE job_postings ADD COLUMN company_name TEXT;
ALTER TABLE job_postings ADD COLUMN company_logo_url TEXT;
ALTER TABLE job_postings ADD COLUMN brand_color TEXT DEFAULT '#3B82F6';