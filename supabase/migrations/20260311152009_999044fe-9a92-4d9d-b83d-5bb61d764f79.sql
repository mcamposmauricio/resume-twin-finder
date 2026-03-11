
CREATE UNIQUE INDEX idx_unique_application_per_email_job
ON public.job_applications (job_posting_id, lower(applicant_email))
WHERE applicant_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.check_duplicate_application(
  _job_posting_id uuid,
  _email text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_applications
    WHERE job_posting_id = _job_posting_id
    AND lower(applicant_email) = lower(_email)
  )
$$;
