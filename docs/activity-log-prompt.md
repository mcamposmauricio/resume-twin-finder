# Prompt Reutilizável: Painel Administrativo Completo com Telemetria

> **Como usar**: Copie todo o conteúdo abaixo (a partir de "---") e cole como mensagem em qualquer projeto Lovable. Substitua todos os placeholders marcados com `[SUBSTITUIR]` pelos valores do seu projeto.

---

## Prompt para enviar ao Lovable:

```
Crie um Painel Administrativo completo com gerenciamento de usuários e log de atividades/telemetria. O painel deve ser acessível apenas pelo email do administrador: [SUBSTITUIR_EMAIL_ADMIN]

O painel deve ter uma página dedicada (ex: `/admin` ou `/atividades`) com 2 abas: "Usuários" e "Atividades".

---

### 1. BANCO DE DADOS

#### 1.1 Tabela `activity_logs`

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

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir logs
CREATE POLICY "Anyone can insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- Apenas o admin pode visualizar
CREATE POLICY "Only admin can view logs"
  ON public.activity_logs FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = '[SUBSTITUIR_EMAIL_ADMIN]');

-- Índices para performance
CREATE INDEX idx_activity_logs_user_email ON public.activity_logs(user_email);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_is_error ON public.activity_logs(is_error) WHERE is_error = true;
```

#### 1.2 Função auxiliar `is_admin_email()`

```sql
CREATE OR REPLACE FUNCTION public.is_admin_email()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT (SELECT email FROM auth.users WHERE id = auth.uid()) = '[SUBSTITUIR_EMAIL_ADMIN]'
$$;
```

Você pode usar `is_admin_email()` nas policies de SELECT ao invés de repetir o email diretamente.

#### 1.3 Database Function RPC para Usuários com Stats

Criar uma função RPC `admin_get_users_with_stats` que retorna todos os usuários com métricas agregadas. A função deve:

- Verificar se o chamador é admin (`is_admin_email()`) e lançar exceção se não for
- Fazer JOIN da tabela `profiles` (ou equivalente) com a tabela principal de uso do sistema
- Retornar: `user_id`, `email`, `name`, `company_name`, `phone`, `created_at`, `is_blocked`, e métricas como:
  - `total_[SUBSTITUIR_RECURSO]` — saldo/créditos disponíveis (ex: `total_resumes`, `total_credits`)
  - `[SUBSTITUIR_METRICA_USO]` — quantidade já consumida (ex: `resumes_analyzed`, `queries_made`)
  - Outras métricas relevantes ao seu sistema
- Ordenar por `created_at DESC`

Exemplo genérico:

```sql
CREATE OR REPLACE FUNCTION public.admin_get_users_with_stats()
  RETURNS TABLE(
    user_id uuid, 
    email text, 
    name text, 
    company_name text, 
    phone text,
    created_at timestamptz, 
    is_blocked boolean,
    total_credits integer,        -- [SUBSTITUIR] saldo disponível
    items_consumed bigint         -- [SUBSTITUIR] uso acumulado
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin_email() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.name,
    p.company_name,
    p.phone,
    p.created_at,
    p.is_blocked,
    p.total_credits,
    -- [SUBSTITUIR] Adapte o cálculo de uso ao seu sistema
    COALESCE(COUNT(u.id), 0)::bigint as items_consumed
  FROM profiles p
  LEFT JOIN [SUBSTITUIR_TABELA_DE_USO] u ON u.user_id = p.user_id
  GROUP BY p.user_id, p.email, p.name, p.company_name, 
           p.phone, p.created_at, p.is_blocked, p.total_credits
  ORDER BY p.created_at DESC;
END;
$$;
```

#### 1.4 Função RPC para Ações Administrativas

```sql
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  _target_user_id uuid, 
  _credits_to_add integer DEFAULT NULL,   -- [SUBSTITUIR] nome do parâmetro
  _set_blocked boolean DEFAULT NULL
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin_email() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  IF _credits_to_add IS NOT NULL THEN
    UPDATE profiles 
    SET total_credits = total_credits + _credits_to_add  -- [SUBSTITUIR] campo
    WHERE user_id = _target_user_id;
  END IF;
  
  IF _set_blocked IS NOT NULL THEN
    UPDATE profiles 
    SET is_blocked = _set_blocked
    WHERE user_id = _target_user_id;
  END IF;
END;
$$;
```

> **Nota**: Se sua tabela `profiles` não tem o campo `is_blocked`, adicione-o: `ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT false;`

---

### 2. HOOK `useActivityLog.ts`

Criar `src/hooks/useActivityLog.ts` com:

- Um tipo `ActionType` com todos os tipos de ação relevantes ao seu sistema, divididos em **ações de sucesso** e **ações de erro**
- Um mapeamento `ACTION_LABELS` com rótulos em português para cada ação
- Uma função `logActivity` que aceita: `userId`, `userEmail`, `companyName?`, `actionType`, `entityType?`, `entityId?`, `metadata?`, `isError?`
- A função deve ser **fire-and-forget** (não bloqueia a UI, sem `await` no ponto de chamada)
- Erros no próprio logging devem ser silenciosos (apenas `console.error`)

**Tipos de ação genéricos** (adapte ao seu sistema):

Sucesso:
- `user_signup` — Novo usuário cadastrado
- `user_login` — Login realizado
- `[SUBSTITUIR]_created` — [Recurso] criado
- `[SUBSTITUIR]_updated` — [Recurso] atualizado
- `[SUBSTITUIR]_deleted` — [Recurso] excluído
- `[SUBSTITUIR]_completed` — [Operação] concluída

Erros:
- `login_error` — Erro no login
- `signup_error` — Erro no cadastro
- `[SUBSTITUIR]_error` — Erro ao [ação]

---

### 3. INSTRUMENTAÇÃO

Adicionar chamadas `logActivity()` em **todos os pontos relevantes** do código:

**Ações de sucesso** — após operações bem-sucedidas:
- Login/Signup
- Criação/edição/exclusão de recursos
- Operações concluídas com sucesso

**Ações de erro** — em todos os `catch` blocks:

```typescript
logActivity({
  userId: user?.id || 'unknown',
  userEmail: user?.email || 'unknown',
  companyName: profile?.company_name,
  actionType: '[TIPO]_error',
  isError: true,
  metadata: {
    error_message: error instanceof Error ? error.message : String(error),
    context: 'descrição do que estava sendo feito',
  },
});
```

---

### 4. PAINEL ADMINISTRATIVO — ABA "USUÁRIOS"

Interface de gerenciamento de usuários com:

**Tabela principal** com colunas:
- Nome, Email, Empresa, Telefone
- Métricas de uso: itens consumidos, saldo disponível (calculado como `total_credits - items_consumed`)
- Data de cadastro
- Status (badge colorida)

**Badges de status**:
- 🟢 Verde (`bg-green-100 text-green-800`) — Ativo (tem uso registrado)
- 🔴 Vermelho (`bg-destructive/10 text-destructive`) — Bloqueado (`is_blocked = true`)
- ⚪ Cinza (`bg-muted text-muted-foreground`) — Apenas cadastro (sem uso)

**Filtros**:
- Campo de busca por email
- Campo de busca por empresa
- Select de status: Todos / Ativos / Apenas cadastro / Bloqueados

**Ações por usuário** (botões na linha):

1. **Adicionar créditos** — Dialog com:
   - Nome e email do usuário
   - Saldo atual exibido
   - Input numérico para quantidade a adicionar
   - Preview do novo saldo (saldo atual + quantidade)
   - Botão de confirmar que chama a RPC `admin_update_user_profile`

2. **Bloquear/Desbloquear** — Dialog de confirmação com:
   - Nome e email do usuário
   - Aviso visual (banner amarelo com ícone de alerta) explicando o que acontece ao bloquear
   - Texto diferente para bloquear vs desbloquear
   - Botão de confirmar que chama a RPC `admin_update_user_profile`

**Alerta de saldo baixo**: Quando o saldo disponível for menor que um limiar (ex: 5), exibir indicador visual na linha (texto em vermelho ou ícone de aviso).

**Paginação**: Server-side, 25 itens por página, com contagem total.

---

### 5. PAINEL ADMINISTRATIVO — ABA "ATIVIDADES"

Interface de log de atividades e telemetria com:

**Tabela de logs** com colunas:
- Data/Hora (formatada como `dd/MM/yyyy HH:mm`)
- Usuário (email)
- Empresa
- Ação (badge colorida com o `action_label`)
- Detalhes (metadata relevante ou `error_message` se for erro)

**Badges de ação**:
- 🔵 Azul (`bg-primary/10 text-primary`) — Ações normais
- 🔴 Vermelha (`bg-destructive/10 text-destructive`) com ícone de alerta (`AlertTriangle`) — Erros (`is_error = true`)

**Filtros avançados**:
- Campo de busca por email do usuário
- Campo de busca por empresa
- **Multi-select com checkboxes** para tipo de ação (lista todos os `ActionType` disponíveis agrupados por sucesso/erro)
- **Seletor de data** com suporte a:
  - Dia único (clique simples no calendário)
  - Período (clique em data inicial e data final)
  - Botão para limpar seleção de data
- **Toggle "Apenas erros"** — Botão que filtra por `is_error = true`, com visual destacado quando ativo (ex: variante `destructive` ou `outline` com ícone)

**Botão "Limpar filtros"**: Reseta todos os filtros de uma vez, visível apenas quando algum filtro está ativo.

**Contagem total**: Exibir "X registros encontrados" acima da tabela.

**Paginação**: Server-side, 50 itens por página. Os filtros devem ser aplicados na query do banco, não client-side.

**Detalhes de erro**: Quando `is_error = true`, exibir na coluna de detalhes o campo `error_message` extraído do `metadata` JSON. Pode usar um tooltip ou texto inline em vermelho.

---

### 6. PROTEÇÃO E SEGURANÇA

**Frontend**:
- O link/menu para o painel admin só deve aparecer se `user?.email === '[SUBSTITUIR_EMAIL_ADMIN]'`
- A página do painel deve verificar o email do usuário no carregamento e redirecionar para a home se não for admin

**Backend (RLS)**:
- A tabela `activity_logs` deve ter INSERT aberto (qualquer autenticado) e SELECT restrito ao admin
- As funções RPC devem verificar `is_admin_email()` e lançar exceção se não for admin
- Logs nunca devem conter dados sensíveis (senhas, tokens) no metadata

**Performance**:
- Logs são fire-and-forget (nunca bloquear a UI)
- Índices nas colunas mais filtradas (`user_email`, `action_type`, `created_at`, `is_error`)
- Paginação server-side obrigatória
- Filtros aplicados via query SQL, não client-side

---

### 7. BACKFILL RETROATIVO (OPCIONAL)

Se o sistema já possui dados históricos, criar queries SQL para preencher o `activity_logs` retroativamente:

```sql
-- Exemplo: backfill de cadastros de usuários
INSERT INTO activity_logs (user_id, user_email, action_type, action_label, entity_type, entity_id, created_at)
SELECT 
  p.user_id,
  COALESCE(p.email, 'unknown'),
  'user_signup',
  'Novo usuário cadastrado',
  'user',
  p.user_id,
  p.created_at
FROM [SUBSTITUIR_TABELA_PROFILES] p
ON CONFLICT DO NOTHING;

-- Exemplo: backfill de operações concluídas
INSERT INTO activity_logs (user_id, user_email, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  o.user_id,
  COALESCE(p.email, 'unknown'),
  '[SUBSTITUIR]_completed',
  '[SUBSTITUIR] concluído',
  '[SUBSTITUIR_ENTITY]',
  o.id,
  jsonb_build_object('key', o.some_field),
  o.created_at
FROM [SUBSTITUIR_TABELA] o
LEFT JOIN [SUBSTITUIR_TABELA_PROFILES] p ON p.user_id = o.user_id
WHERE o.status = 'completed'
ON CONFLICT DO NOTHING;
```

Adapte as queries para cada tabela relevante do seu sistema.

---

### CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Função `is_admin_email()` criada
- [ ] Tabela `activity_logs` criada com RLS e índices
- [ ] RPC `admin_get_users_with_stats` criada
- [ ] RPC `admin_update_user_profile` criada
- [ ] Campo `is_blocked` na tabela profiles (se não existir)
- [ ] Hook `useActivityLog.ts` com tipos e função `logActivity`
- [ ] Instrumentação de ações de sucesso
- [ ] Instrumentação de erros em catch blocks
- [ ] Página admin com aba "Usuários" (tabela, filtros, ações, paginação)
- [ ] Página admin com aba "Atividades" (tabela, filtros avançados, badges, paginação)
- [ ] Dialog de adicionar créditos com preview de saldo
- [ ] Dialog de bloquear/desbloquear com aviso
- [ ] Toggle "Apenas erros" na aba de atividades
- [ ] Badges vermelhas para erros com ícone de alerta
- [ ] Exibição de `error_message` nos detalhes
- [ ] Menu admin condicional no frontend
- [ ] Redirecionamento se não-admin acessar a página
- [ ] Backfill retroativo executado (se aplicável)
```

---

## Lista de Placeholders para Substituir

| Placeholder | Descrição | Exemplo |
|---|---|---|
| `[SUBSTITUIR_EMAIL_ADMIN]` | Email do administrador | `admin@empresa.com` |
| `[SUBSTITUIR_RECURSO]` | Nome do recurso principal do sistema | `resumes`, `credits`, `queries` |
| `[SUBSTITUIR_METRICA_USO]` | Nome da métrica de consumo | `resumes_analyzed`, `queries_made` |
| `[SUBSTITUIR_TABELA_DE_USO]` | Tabela que registra o uso do sistema | `analyses`, `queries`, `transactions` |
| `[SUBSTITUIR_TABELA_PROFILES]` | Tabela de perfis dos usuários | `profiles`, `users` |
| `[SUBSTITUIR_TABELA]` | Tabela de operações para backfill | `analyses`, `orders` |
| `[SUBSTITUIR_ENTITY]` | Tipo da entidade para logs | `analysis`, `order`, `report` |
| `[SUBSTITUIR]_created/updated/error` | Tipos de ação específicos | `report_created`, `order_error` |
