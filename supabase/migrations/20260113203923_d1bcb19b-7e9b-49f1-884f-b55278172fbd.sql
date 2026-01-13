-- Adicionar novos campos na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS hr_hub_user_id TEXT,
ADD COLUMN IF NOT EXISTS cargo TEXT;

-- Função para atualizar hash da senha (para login bcrypt do HR Hub)
CREATE OR REPLACE FUNCTION public.update_user_password_hash(p_user_id uuid, p_password_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'public'
AS $update_hash$
BEGIN
  UPDATE auth.users
  SET encrypted_password = p_password_hash
  WHERE id = p_user_id;
END;
$update_hash$;

-- Função para obter hash da senha
CREATE OR REPLACE FUNCTION public.get_user_password_hash(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'public'
AS $get_hash$
DECLARE
  password_hash text;
BEGIN
  SELECT encrypted_password INTO password_hash
  FROM auth.users
  WHERE id = p_user_id;

  RETURN password_hash;
END;
$get_hash$;

-- Atualizar função handle_new_user para suportar novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $handle_user$
BEGIN
  -- Check if email is corporate (skip for HR Hub users)
  IF (NEW.raw_user_meta_data ->> 'source') IS NULL OR (NEW.raw_user_meta_data ->> 'source') != 'hr_hub' THEN
    IF NOT is_corporate_email(NEW.email) THEN
      RAISE EXCEPTION 'Por favor, use um e-mail corporativo para continuar.';
    END IF;
  END IF;

  INSERT INTO public.profiles (
    user_id, 
    email, 
    referred_by_code, 
    name, 
    company_name, 
    employee_count, 
    phone,
    source,
    hr_hub_user_id,
    cargo
  )
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'referred_by_code',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'employee_count',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'source', 'manual'),
    NEW.raw_user_meta_data ->> 'hr_hub_user_id',
    NEW.raw_user_meta_data ->> 'cargo'
  );
  RETURN NEW;
END;
$handle_user$;