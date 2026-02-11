
CREATE OR REPLACE FUNCTION public.is_template_authorized_email()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (SELECT email FROM auth.users WHERE id = auth.uid()) 
    IN ('rebeca.liberato@letsmake.com.br', 'mauricio@marqponto.com.br', 'thaina@marqponto.com.br')
$$;

DROP POLICY IF EXISTS "Authorized users can view job templates" ON public.job_templates;

CREATE POLICY "Authorized users can view job templates"
ON public.job_templates
FOR SELECT
USING (is_template_authorized_email());
