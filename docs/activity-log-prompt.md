# Prompt Reutilizável: Sistema de Activity Log / Telemetria de Uso

> **Objetivo**: Copie este prompt e envie para qualquer projeto Lovable para criar um sistema completo de log de atividades com telemetria de uso, incluindo erros, painel administrativo e backfill retroativo.

---

## Prompt para enviar ao Lovable:

```
Crie um sistema completo de log de atividades (activity log) para monitorar e rastrear todas as ações dos usuários na plataforma, incluindo erros. O sistema deve ter:

### 1. Tabela no Banco de Dados

Criar a tabela `activity_logs` com a seguinte estrutura:

```sql
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  company_name TEXT,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_error BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode inserir logs
CREATE POLICY "Anyone can insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- Política: apenas o admin pode visualizar os logs
-- IMPORTANTE: Substitua 'SEU_EMAIL_ADMIN@empresa.com' pelo email do administrador
CREATE POLICY "Only admin can view logs"
  ON public.activity_logs FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'SEU_EMAIL_ADMIN@empresa.com');

-- Índices para performance
CREATE INDEX idx_activity_logs_user_email ON public.activity_logs(user_email);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_is_error ON public.activity_logs(is_error) WHERE is_error = true;
```

### 2. Hook `useActivityLog.ts`

Criar um hook em `src/hooks/useActivityLog.ts` com:

- Tipo `ActionType` com todos os tipos de ação da aplicação (sucesso e erro)
- Mapeamento `ACTION_LABELS` com rótulos em português para cada ação
- Função `logActivity` que aceita: `userId`, `userEmail`, `companyName?`, `actionType`, `entityType?`, `entityId?`, `metadata?`, `isError?`
- A função deve ser fire-and-forget (não bloquear a UI)
- Erros no próprio logging devem ser silenciosos (apenas console.error)

Exemplo de tipos de ação:
- Sucesso: `user_signup`, `user_login`, `analysis_started`, `analysis_completed`, `job_created`, `job_published`, `application_received`
- Erros: `login_error`, `signup_error`, `analysis_error`, `job_create_error`, `application_submit_error`, `settings_save_error`

### 3. Instrumentação

Adicionar chamadas `logActivity()` em todos os pontos relevantes do código:

**Ações de sucesso** (já existentes ou novos):
- Login/Signup bem-sucedidos
- Criação/edição/publicação de recursos
- Análises iniciadas/concluídas

**Ações de erro** (nos `catch` blocks):
- Erros de autenticação
- Falhas em operações CRUD
- Erros de API/edge functions
- Erros de upload

Para cada catch block, adicionar:
```typescript
logActivity({
  userId: user?.id || 'unknown',
  userEmail: user?.email || 'unknown',
  actionType: 'tipo_do_erro',
  isError: true,
  metadata: {
    error_message: error.message,
    context: 'descrição do contexto',
  },
});
```

### 4. Painel Administrativo

Criar uma página `/admin/atividades` acessível apenas ao email do administrador, com:

- **Tabela de logs** com colunas: Data/Hora, Usuário, Empresa, Ação, Detalhes
- **Filtros**: 
  - Busca por email do usuário
  - Busca por empresa
  - Filtro por tipo de ação (multi-select com checkboxes)
  - Filtro por data (dia único ou período)
  - Toggle "Apenas erros" (filtra por `is_error = true`)
- **Badges coloridas**: 
  - Azul (bg-primary/10) para ações normais
  - Vermelha (bg-destructive/10) para erros, com ícone de alerta
- **Detalhes de erro**: quando `is_error = true`, mostrar `error_message` do metadata
- **Paginação**: 50 itens por página
- **Contagem total** de registros encontrados

### 5. Backfill Retroativo

Criar queries SQL para preencher o activity_log com dados históricos a partir das tabelas existentes:

```sql
-- Backfill de análises concluídas
INSERT INTO activity_logs (user_id, user_email, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  a.user_id,
  COALESCE(p.email, 'unknown'),
  'analysis_completed',
  'Análise concluída',
  'analysis',
  a.id,
  jsonb_build_object('tokens_used', a.tokens_used, 'candidates_count', jsonb_array_length(a.candidates)),
  a.created_at
FROM analyses a
LEFT JOIN profiles p ON p.user_id = a.user_id
WHERE a.status = 'completed'
ON CONFLICT DO NOTHING;

-- Backfill de cadastros de usuários
INSERT INTO activity_logs (user_id, user_email, action_type, action_label, entity_type, entity_id, created_at)
SELECT 
  p.user_id,
  COALESCE(p.email, 'unknown'),
  'user_signup',
  'Novo usuário cadastrado',
  'user',
  p.user_id,
  p.created_at
FROM profiles p
ON CONFLICT DO NOTHING;

-- Adapte para outras tabelas conforme necessário (job_postings, job_applications, etc.)
```

### 6. Segurança

- A página de admin deve verificar o email do usuário tanto no frontend (redirecionamento) quanto no backend (RLS)
- O menu de acesso ao admin deve ser condicional (`user?.email === 'SEU_EMAIL@empresa.com'`)
- Logs nunca devem expor dados sensíveis no metadata
- A inserção de logs deve usar RLS permissiva para INSERT (qualquer autenticado)
- A leitura deve ser restrita ao admin via RLS

### 7. Considerações de Performance

- Logs são fire-and-forget (não bloqueiam a UI)
- Usar índices nas colunas mais filtradas
- Paginação server-side (não carregar todos os logs de uma vez)
- Os filtros devem atualizar a query, não filtrar client-side
```

---

## Checklist de Implementação

- [ ] Tabela `activity_logs` criada com RLS
- [ ] Hook `useActivityLog.ts` com tipos e função `logActivity`
- [ ] Instrumentação de ações de sucesso em todas as páginas
- [ ] Instrumentação de erros em todos os catch blocks
- [ ] Página admin com tabela, filtros e paginação
- [ ] Toggle "Apenas erros" no painel
- [ ] Badges vermelhas para erros
- [ ] Exibição de `error_message` nos detalhes
- [ ] Backfill retroativo executado
- [ ] Rota protegida no frontend e backend
