-- Criar tabela de etapas do pipeline
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT NOT NULL DEFAULT 'circle',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para performance
CREATE INDEX idx_pipeline_stages_user ON pipeline_stages(user_id);

-- Constraint de slug unico por usuario
CREATE UNIQUE INDEX idx_pipeline_stages_user_slug ON pipeline_stages(user_id, slug);

-- RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stages"
ON pipeline_stages FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Funcao para criar etapas padrao ao criar perfil
CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pipeline_stages (user_id, name, slug, color, icon, "order", is_default)
  VALUES 
    (NEW.user_id, 'Nova candidatura', 'new', '#6B7280', 'inbox', 0, true),
    (NEW.user_id, 'Baixa aderência', 'low_fit', '#EA580C', 'thumbs-down', 1, false),
    (NEW.user_id, 'Merece análise', 'deserves_analysis', '#3B82F6', 'star', 2, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_created_add_stages
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_default_pipeline_stages();

-- Migrar dados existentes: criar etapas para usuarios que ja existem
INSERT INTO pipeline_stages (user_id, name, slug, color, icon, "order", is_default)
SELECT DISTINCT 
  p.user_id, 
  'Nova candidatura', 
  'new', 
  '#6B7280', 
  'inbox', 
  0, 
  true
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.user_id = p.user_id);

INSERT INTO pipeline_stages (user_id, name, slug, color, icon, "order", is_default)
SELECT DISTINCT p.user_id, 'Baixa aderência', 'low_fit', '#EA580C', 'thumbs-down', 1, false
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.user_id = p.user_id AND ps.slug = 'low_fit');

INSERT INTO pipeline_stages (user_id, name, slug, color, icon, "order", is_default)
SELECT DISTINCT p.user_id, 'Merece análise', 'deserves_analysis', '#3B82F6', 'star', 2, false
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.user_id = p.user_id AND ps.slug = 'deserves_analysis');