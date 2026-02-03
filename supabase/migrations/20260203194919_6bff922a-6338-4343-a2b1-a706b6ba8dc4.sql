-- Update existing default stages to new names
UPDATE pipeline_stages 
SET name = 'Análise de currículo', icon = 'file-text', color = '#8B5CF6'
WHERE slug = 'new';

UPDATE pipeline_stages 
SET name = 'Análise comportamental', slug = 'behavioral', icon = 'user', color = '#8B5CF6', "order" = 1
WHERE slug = 'low_fit';

UPDATE pipeline_stages 
SET name = 'Entrevista Técnica', slug = 'technical_interview', icon = 'briefcase', color = '#8B5CF6', "order" = 2
WHERE slug = 'deserves_analysis';

-- Add Carta Proposta stage for existing users who don't have it
INSERT INTO pipeline_stages (user_id, name, slug, color, icon, "order", is_default)
SELECT DISTINCT p.user_id, 'Carta Proposta', 'proposal', '#8B5CF6', 'send', 3, false
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.user_id = p.user_id AND ps.slug = 'proposal');

-- Update the trigger function to create new default stages
CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pipeline_stages (user_id, name, slug, color, icon, "order", is_default)
  VALUES 
    (NEW.user_id, 'Análise de currículo', 'new', '#8B5CF6', 'file-text', 0, true),
    (NEW.user_id, 'Análise comportamental', 'behavioral', '#8B5CF6', 'user', 1, false),
    (NEW.user_id, 'Entrevista Técnica', 'technical_interview', '#8B5CF6', 'briefcase', 2, false),
    (NEW.user_id, 'Carta Proposta', 'proposal', '#8B5CF6', 'send', 3, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;