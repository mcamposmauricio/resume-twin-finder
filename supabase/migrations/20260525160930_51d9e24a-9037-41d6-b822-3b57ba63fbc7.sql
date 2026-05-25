CREATE OR REPLACE FUNCTION public.is_template_authorized_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (SELECT email FROM auth.users WHERE id = auth.uid()) 
    IN ('anne.caroline.osorio@gmail.com', 'mauricio@marqponto.com.br', 'thaina@marqponto.com.br', 'marco@marqponto.com.br')
$function$;