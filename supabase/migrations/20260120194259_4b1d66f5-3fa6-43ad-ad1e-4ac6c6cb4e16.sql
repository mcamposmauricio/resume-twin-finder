-- Allow public to view form templates linked to active job postings
CREATE POLICY "Public can view form templates for active jobs"
ON public.form_templates
FOR SELECT
USING (
  id IN (
    SELECT form_template_id 
    FROM job_postings 
    WHERE status = 'active' AND form_template_id IS NOT NULL
  )
);

-- Allow public uploads to resumes bucket
CREATE POLICY "Public can upload resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Allow users to view resumes for their job postings
CREATE POLICY "Users can view resumes for their jobs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete resumes for their jobs
CREATE POLICY "Users can delete resumes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'resumes' 
  AND auth.uid() IS NOT NULL
);