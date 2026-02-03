-- Adicionar campos para informações da empresa e customização da página de carreiras
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_tagline TEXT,
ADD COLUMN IF NOT EXISTS company_about TEXT,
ADD COLUMN IF NOT EXISTS company_benefits JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS company_culture TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_linkedin TEXT,
ADD COLUMN IF NOT EXISTS company_instagram TEXT,
ADD COLUMN IF NOT EXISTS careers_hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS careers_cta_text TEXT DEFAULT 'Venha fazer parte!',
ADD COLUMN IF NOT EXISTS careers_show_about BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS careers_show_benefits BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS careers_show_culture BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS careers_show_social BOOLEAN DEFAULT true;