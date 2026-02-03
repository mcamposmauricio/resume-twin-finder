-- Adicionar campos de branding na tabela profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS careers_page_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS careers_page_enabled BOOLEAN DEFAULT false;

-- Migrar dados existentes das vagas para profiles
UPDATE profiles p
SET 
  company_logo_url = COALESCE(p.company_logo_url, (
    SELECT company_logo_url FROM job_postings jp 
    WHERE jp.user_id = p.user_id AND jp.company_logo_url IS NOT NULL 
    LIMIT 1
  )),
  brand_color = COALESCE(p.brand_color, (
    SELECT brand_color FROM job_postings jp 
    WHERE jp.user_id = p.user_id AND jp.brand_color IS NOT NULL 
    LIMIT 1
  ));

-- Criar funcao para gerar slug unico de carreiras
CREATE OR REPLACE FUNCTION public.generate_careers_slug(company text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := lower(regexp_replace(company, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'empresa';
  END IF;
  
  final_slug := base_slug;
  
  WHILE EXISTS(SELECT 1 FROM profiles WHERE careers_page_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Permitir acesso publico a profiles com careers_page_enabled (para pagina de carreiras)
CREATE POLICY "Public can view careers-enabled profiles"
ON profiles FOR SELECT
USING (careers_page_enabled = true);