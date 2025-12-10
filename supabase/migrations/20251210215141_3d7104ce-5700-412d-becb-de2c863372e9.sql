-- Create function to validate corporate email
CREATE OR REPLACE FUNCTION public.is_corporate_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  domain TEXT;
  blocked_domains TEXT[] := ARRAY[
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br',
    'live.com', 'icloud.com', 'bol.com.br', 'uol.com.br', 'terra.com.br',
    'proton.me', 'protonmail.com', 'aol.com', 'msn.com', 'globo.com',
    'ig.com.br', 'r7.com', 'zipmail.com.br', 'me.com', 'mail.com',
    'ymail.com', 'gmx.com', 'gmx.net'
  ];
BEGIN
  domain := lower(split_part(email, '@', 2));
  RETURN NOT (domain = ANY(blocked_domains));
END;
$$;

-- Update handle_new_user function to validate corporate email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email is corporate
  IF NOT is_corporate_email(NEW.email) THEN
    RAISE EXCEPTION 'Por favor, use um e-mail corporativo para continuar.';
  END IF;

  INSERT INTO public.profiles (user_id, email, referred_by_code)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'referred_by_code'
  );
  RETURN NEW;
END;
$$;