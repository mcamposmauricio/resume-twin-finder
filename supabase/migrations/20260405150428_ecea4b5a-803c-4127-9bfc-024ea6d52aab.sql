DROP FUNCTION IF EXISTS public.get_talent_applications(uuid, text);

CREATE OR REPLACE FUNCTION public.get_talent_applications(p_user_id uuid, p_email text)
 RETURNS TABLE(id uuid, job_posting_id uuid, job_title text, job_status text, triage_status text, status text, created_at timestamp with time zone, resume_url text, resume_filename text, form_data jsonb, form_fields jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ja.id,
    ja.job_posting_id,
    jp.title AS job_title,
    jp.status AS job_status,
    ja.triage_status,
    ja.status,
    ja.created_at,
    ja.resume_url,
    ja.resume_filename,
    ja.form_data,
    ft.fields AS form_fields
  FROM job_applications ja
  INNER JOIN job_postings jp ON jp.id = ja.job_posting_id
  LEFT JOIN form_templates ft ON ft.id = jp.form_template_id
  WHERE jp.user_id = p_user_id
    AND lower(ja.applicant_email) = lower(p_email)
  ORDER BY ja.created_at DESC;
$function$;