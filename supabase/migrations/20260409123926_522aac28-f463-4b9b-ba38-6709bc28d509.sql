
CREATE OR REPLACE FUNCTION public.is_admin_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (SELECT email FROM auth.users WHERE id = auth.uid()) 
    IN ('mauricio@marqponto.com.br', 'marco@marqponto.com.br')
$function$;

CREATE OR REPLACE FUNCTION public.is_template_authorized_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (SELECT email FROM auth.users WHERE id = auth.uid()) 
    IN ('rebeca.liberato@letsmake.com.br', 'mauricio@marqponto.com.br', 'thaina@marqponto.com.br', 'marco@marqponto.com.br')
$function$;
