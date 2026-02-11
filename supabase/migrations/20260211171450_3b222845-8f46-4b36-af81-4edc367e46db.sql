
DROP POLICY "Authorized users can view job templates" ON public.job_templates;

CREATE POLICY "Full access users can view job templates"
ON public.job_templates
FOR SELECT
USING (is_full_access(auth.uid()));
