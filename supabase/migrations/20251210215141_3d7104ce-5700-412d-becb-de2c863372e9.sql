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
    -- pessoais comuns
    'gmail.com', 'gmail.com.br',
    'hotmail.com', 'hotmail.com.br',
    'outlook.com', 'outlook.com.br',
    'yahoo.com', 'yahoo.com.br',
    'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com', 'zoho.com',
    'proton.me', 'protonmail.com',
    'mail.com', 'gmx.com', 'gmx.net',

    -- provedores brasileiros
    'bol.com.br', 'uol.com.br', 'terra.com.br',
    'ig.com.br', 'r7.com', 'zipmail.com.br',
    'globo.com', 'superig.com.br',
    'oi.com.br', 'brturbo.com.br', 'pop.com.br',

    -- temporários / descartáveis
    'mailinator.com', 'yopmail.com', '10minutemail.com',
    'temp-mail.org', 'guerrillamail.com', 'sharklasers.com',
    'getnada.com', 'trashmail.com', 'dispostable.com',
    'maildrop.cc', 'fakeinbox.com', 'throwawaymail.com',

    -- domínios de teste (EN + PT + versões .br)
    'example.com', 'example.com.br',
    'test.com', 'test.com.br',
    'testing.com', 'testing.com.br',
    'email.com', 'email.com.br',
    'teste.com', 'teste.com.br',
    'exemplo.com', 'exemplo.com.br',
    'dominiofake.com', 'dominiofake.com.br',
    'emailfake.com', 'emailfake.com.br',
    'testando.com', 'testando.com.br',
    'seusite.com', 'seusite.com.br'
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