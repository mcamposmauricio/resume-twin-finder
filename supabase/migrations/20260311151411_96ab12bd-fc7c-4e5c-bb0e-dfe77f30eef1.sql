
CREATE POLICY "Users can delete applications for their jobs"
ON public.job_applications
FOR DELETE
TO public
USING (job_posting_id IN (
  SELECT id FROM job_postings WHERE user_id = auth.uid()
));
