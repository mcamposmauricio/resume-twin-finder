
## Plano: Etapas Configuraveis de Candidatos e Melhorias no Kanban

### Visao Geral

Implementar tres melhorias principais:
1. Permitir configurar etapas/colunas do kanban na pagina de configuracoes
2. Implementar drag and drop real no kanban de candidaturas
3. Melhorar a visualizacao de informacoes do candidato e navegacao entre etapas

---

### 1. Etapas Configuraveis (Settings)

**Situacao Atual:**
- As etapas sao hardcoded em `ApplicationKanban.tsx` (linhas 17-21)
- Tipos de `TriageStatus` sao fixos: `new`, `low_fit`, `deserves_analysis`
- Labels estao em `TRIAGE_STATUS_LABELS` no arquivo `types/jobs.ts`

**Mudanca:**
- Criar nova tabela `pipeline_stages` para armazenar etapas personalizadas por usuario
- Adicionar nova aba "Pipeline" na pagina de configuracoes
- Permitir criar, editar, reordenar e excluir etapas
- Cada etapa tem: nome, cor, icone, ordem
- Incluir etapas padrao ao criar perfil de usuario

**Estrutura da tabela `pipeline_stages`:**
```text
id: uuid (PK)
user_id: uuid (FK profiles)
name: text (ex: "Triagem Inicial")
slug: text (ex: "triagem_inicial") - usado como identificador
color: text (ex: "#3B82F6")
icon: text (ex: "inbox", "star", "check")
order: integer
is_default: boolean (etapa inicial para novos candidatos)
created_at: timestamp
```

---

### 2. Drag and Drop no Kanban

**Situacao Atual:**
- Navegacao entre colunas usa botoes de seta (ArrowLeft/ArrowRight)
- Nao existe drag and drop implementado

**Mudanca:**
- Instalar `@dnd-kit/core` e `@dnd-kit/sortable` para drag and drop
- Implementar drag entre colunas para mover candidatos
- Manter botoes de seta como alternativa
- Mostrar feedback visual durante o arraste
- Atualizar status no banco ao soltar

**Componentes afetados:**
- `ApplicationKanban.tsx` - wrapper com DndContext
- `ApplicationCard.tsx` - tornar arrastavel com useDraggable
- Criar `KanbanColumn.tsx` - area de drop com useDroppable

---

### 3. Melhorias na Visualizacao do Candidato

**Situacao Atual:**
- `ApplicationDetailPanel.tsx` mostra informacoes basicas
- Select dropdown para mudar status
- Navegacao prev/next entre candidatos

**Melhorias:**
- Adicionar barra de navegacao de etapas visual (stepper)
- Botoes grandes e claros para "Mover para proxima etapa" e "Mover para etapa anterior"
- Exibir nome da etapa atual com destaque
- Mostrar progresso visual do candidato no pipeline
- Melhorar layout das informacoes do formulario
- Adicionar acoes rapidas (rejeitar, aprovar, agendar entrevista)

---

### Detalhes Tecnicos

**Migracao de Banco de Dados:**
```sql
-- Criar tabela de etapas do pipeline
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
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
    (NEW.user_id, 'Baixa aderencia', 'low_fit', '#EA580C', 'thumbs-down', 1, false),
    (NEW.user_id, 'Merece analise', 'deserves_analysis', '#3B82F6', 'star', 2, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
SELECT DISTINCT p.user_id, 'Baixa aderencia', 'low_fit', '#EA580C', 'thumbs-down', 1, false
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.user_id = p.user_id AND ps.slug = 'low_fit');

INSERT INTO pipeline_stages (user_id, name, slug, color, icon, "order", is_default)
SELECT DISTINCT p.user_id, 'Merece analise', 'deserves_analysis', '#3B82F6', 'star', 2, false
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.user_id = p.user_id AND ps.slug = 'deserves_analysis');
```

**Dependencia NPM:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### Arquivos a Criar

1. **`src/hooks/usePipelineStages.ts`**
   - Hook para buscar, criar, atualizar, deletar etapas
   - Reordenacao de etapas
   - Cache local

2. **`src/components/jobs/KanbanColumn.tsx`**
   - Componente de coluna com useDroppable
   - Header com nome, cor e contador
   - Scroll area para cards

3. **`src/components/jobs/DraggableApplicationCard.tsx`**
   - Wrapper do ApplicationCard com useDraggable
   - Overlay durante arraste

4. **`src/components/settings/PipelineStagesEditor.tsx`**
   - Interface para criar/editar/reordenar etapas
   - Lista arrastavel de etapas
   - Dialogs para criar/editar

5. **`src/components/jobs/StageNavigator.tsx`**
   - Componente de stepper visual para navegacao entre etapas
   - Botoes de acao para mover candidato

---

### Arquivos a Modificar

1. **`src/pages/Settings.tsx`**
   - Adicionar terceira aba "Pipeline"
   - Importar e renderizar PipelineStagesEditor

2. **`src/components/jobs/ApplicationKanban.tsx`**
   - Remover COLUMNS hardcoded
   - Adicionar DndContext wrapper
   - Receber stages como prop
   - Implementar onDragEnd handler

3. **`src/components/jobs/ApplicationDetailPanel.tsx`**
   - Adicionar StageNavigator no topo
   - Melhorar botoes de navegacao entre etapas
   - Receber stages como prop
   - Layout mais claro e acoes diretas

4. **`src/components/jobs/ApplicationCard.tsx`**
   - Remover dependencia de TriageStatus hardcoded
   - Receber cor/icone da etapa como prop

5. **`src/pages/JobPostingDetails.tsx`**
   - Buscar etapas do usuario
   - Passar stages para ApplicationKanban
   - Passar stages para ApplicationDetailPanel

6. **`src/types/jobs.ts`**
   - Adicionar interface PipelineStage
   - Manter TriageStatus para retrocompatibilidade
   - Atualizar JobApplication para usar stage_id (opcional)

---

### Interface Visual - Editor de Pipeline

```text
Aba "Pipeline" nas Configuracoes:
+----------------------------------------------------------+
| Etapas do Pipeline                            [+ Nova]   |
+----------------------------------------------------------+
| Arraste para reordenar                                   |
|                                                          |
| [=] Nova candidatura        [Inbox]    #6B7280  [Editar] |
| [=] Triagem Inicial         [Filter]   #F59E0B  [Editar] |
| [=] Entrevista Agendada     [Calendar] #10B981  [Editar] |
| [=] Proposta Enviada        [Send]     #8B5CF6  [Editar] |
| [=] Contratado              [Check]    #22C55E  [Editar] |
| [=] Rejeitado               [X]        #EF4444  [Editar] |
|                                                          |
+----------------------------------------------------------+
```

### Interface Visual - Kanban Melhorado

```text
+---------------+---------------+---------------+---------------+
| Triagem (5)   | Entrevista (3)| Proposta (1) | Contratado (2)|
+---------------+---------------+---------------+---------------+
| [Card]        | [Card]        | [Card]       | [Card]        |
| [Card]  <---> | [Card]        |              | [Card]        |
| [Card]        | [Card]        |              |               |
| ...           |               |              |               |
|               |               |              |               |
| <- -> setas   |               |              |               |
+---------------+---------------+---------------+---------------+

Drag visual:
- Card fica semitransparente na origem
- Overlay segue o cursor
- Coluna destino destaca ao passar mouse
```

### Interface Visual - Painel do Candidato Melhorado

```text
+----------------------------------------------------------+
| <- Voltar                                                 |
+----------------------------------------------------------+
| [1]--[2]--[3]--[4]--[5]  <- Stepper visual               |
| Triagem > Entrevista > Proposta > Contratado             |
|          ^^ ATUAL                                         |
+----------------------------------------------------------+
| Joao Silva                                                |
| joao@email.com | Pendente                                 |
| Aplicou em 03/02/2026 as 14:30                           |
+----------------------------------------------------------+
|                                                          |
| [<- Voltar para Triagem]    [Avancar para Proposta ->]   |
|                                                          |
+----------------------------------------------------------+
| Respostas do Formulario                                  |
| +------------------------------------------------------+ |
| | Nome: Joao Silva                                     | |
| | Email: joao@email.com                                | |
| | LinkedIn: linkedin.com/in/joaosilva                  | |
| | Anos de experiencia: 5                               | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
| Curriculo                                [Abrir] [Baixar]|
| +------------------------------------------------------+ |
| |                   PDF Preview                        | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
| [1/5]                                 [<Anterior] [Prox>]|
+----------------------------------------------------------+
```

---

### Passos de Implementacao

1. **Banco de dados:**
   - Criar tabela `pipeline_stages`
   - Adicionar trigger para criar etapas padrao
   - Migrar usuarios existentes

2. **Hook e tipos:**
   - Criar `usePipelineStages.ts`
   - Atualizar `types/jobs.ts`

3. **Instalar dependencia:**
   - `@dnd-kit/core` para drag and drop

4. **Componentes do Kanban:**
   - Criar `KanbanColumn.tsx` e `DraggableApplicationCard.tsx`
   - Atualizar `ApplicationKanban.tsx` com DndContext

5. **Editor de Pipeline:**
   - Criar `PipelineStagesEditor.tsx`
   - Adicionar aba em `Settings.tsx`

6. **Painel de Candidato:**
   - Criar `StageNavigator.tsx`
   - Atualizar `ApplicationDetailPanel.tsx`

7. **Integracao:**
   - Atualizar `JobPostingDetails.tsx` para buscar stages
   - Conectar tudo com as novas etapas dinamicas

---

### Retrocompatibilidade

- O campo `triage_status` continua existindo na tabela `job_applications`
- Se usuario nao tiver etapas customizadas, usa as etapas padrao
- Mapeamento automatico entre slugs antigos (`new`, `low_fit`, `deserves_analysis`) e novos
- Transicao gradual sem quebrar dados existentes
