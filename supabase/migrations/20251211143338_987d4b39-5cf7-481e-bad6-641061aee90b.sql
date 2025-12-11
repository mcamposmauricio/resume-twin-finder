-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS employee_count text;

-- Update handle_new_user function to capture these fields from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if email is corporate
  IF NOT is_corporate_email(NEW.email) THEN
    RAISE EXCEPTION 'Por favor, use um e-mail corporativo para continuar.';
  END IF;

  INSERT INTO public.profiles (user_id, email, referred_by_code, name, company_name, employee_count)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'referred_by_code',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'employee_count'
  );
  RETURN NEW;
END;
$function$;