-- Adicionar campo status na tabela analyses
ALTER TABLE public.analyses 
ADD COLUMN status text NOT NULL DEFAULT 'completed';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE public.analyses 
ADD CONSTRAINT analyses_status_check CHECK (status IN ('draft', 'completed'));

-- Criar índice para buscar rascunhos
CREATE INDEX idx_analyses_status ON public.analyses(status);