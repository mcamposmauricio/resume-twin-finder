

## Plano: Painel de Usuarios com Gerenciamento Completo

### Visao Geral

Adicionar uma nova aba "Usuarios" na pagina de Log de Atividades com lista completa de usuarios, estatisticas de uso, funcionalidade para adicionar tokens e botao para bloquear usuarios de realizar analises.

---

### O Que Sera Implementado

**1. Nova coluna `is_blocked` na tabela profiles**
- Adicionar campo booleano para controlar se o usuario esta bloqueado
- Default: `false`
- Usuarios bloqueados nao poderao iniciar novas analises

**2. Interface com abas**
- Aba "Atividades" (log atual)
- Aba "Usuarios" (nova lista de usuarios)

**3. Tabela de Usuarios com as seguintes colunas:**
- Nome
- Email
- Empresa
- Telefone
- Cargo
- Data de cadastro
- Role (lead/full_access)
- Curriculos analisados
- Tokens usados
- Saldo disponivel
- Status (Ativo/Bloqueado/Apenas cadastro)
- Acoes (+ Tokens, Bloquear/Desbloquear)

**4. Funcionalidade de adicionar tokens:**
- Botao "+ Tokens" em cada linha
- Dialog modal com campo para quantidade
- Atualizacao do campo `total_resumes` no perfil do usuario
- Registro de log de atividade

**5. Funcionalidade de bloquear usuario:**
- Botao "Bloquear" em cada linha (muda para "Desbloquear" se bloqueado)
- Confirmacao antes de bloquear
- Usuarios bloqueados: badge vermelho na lista
- Impede realizacao de analises (verificacao no frontend e backend)

**6. Validacao de bloqueio no fluxo de analise:**
- Adicionar verificacao no Edge Function `analyze-resumes` antes de processar
- Adicionar verificacao no frontend antes de iniciar analise
- Manter estrutura de permissionamento existente (lead/full_access) intacta

**7. Dados retroativos:**
- A query ja busca dados de todas as tabelas existentes (profiles, user_roles, analyses)
- Todas as informacoes historicas serao exibidas automaticamente

---

### Indicadores Visuais

- Badge "Apenas cadastro" (cinza): usuarios com 0 analises
- Badge "Ativo" (verde): usuarios que ja usaram o sistema
- Badge "Bloqueado" (vermelho): usuarios que nao podem analisar
- Alerta visual para saldo baixo (menos de 3 curriculos)

---

### Detalhes Tecnicos

**Arquivos a criar:**
- `src/components/admin/UserManagementTab.tsx` - Componente da aba de usuarios
- `src/components/admin/AddTokensDialog.tsx` - Dialog para adicionar tokens
- `src/components/admin/BlockUserDialog.tsx` - Dialog de confirmacao de bloqueio

**Arquivos a modificar:**
- `src/pages/ActivityLog.tsx` - Adicionar sistema de abas
- `src/pages/Index.tsx` - Verificar bloqueio antes de iniciar analise
- `src/pages/JobPostingDetails.tsx` - Verificar bloqueio antes de analise de vagas
- `supabase/functions/analyze-resumes/index.ts` - Verificar bloqueio no backend

**Migracao de banco de dados:**
```sql
-- Adicionar coluna is_blocked
ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT false;
```

**Nova funcao RPC para admin gerenciar usuarios:**
```sql
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  _target_user_id uuid, 
  _resumes_to_add integer DEFAULT NULL,
  _set_blocked boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_email() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  IF _resumes_to_add IS NOT NULL THEN
    UPDATE profiles 
    SET total_resumes = total_resumes + _resumes_to_add
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

**Nova funcao para verificar bloqueio (usada pelo Edge Function):**
```sql
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_blocked FROM profiles WHERE user_id = _user_id),
    false
  )
$$;
```

**Query para buscar usuarios (roda apenas para admin):**
```sql
SELECT 
  p.user_id, p.email, p.name, p.company_name, 
  p.phone, p.cargo, p.total_resumes, p.is_blocked,
  p.created_at, ur.role,
  COUNT(a.id) as total_analyses,
  COALESCE(SUM(a.tokens_used), 0) as total_tokens_used,
  COALESCE(SUM(jsonb_array_length(a.candidates)), 0) as resumes_analyzed
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
LEFT JOIN analyses a ON a.user_id = p.user_id AND a.status = 'completed'
GROUP BY p.user_id, p.email, p.name, p.company_name, 
         p.phone, p.cargo, p.total_resumes, p.is_blocked,
         p.created_at, ur.role
ORDER BY p.created_at DESC
```

---

### Preservacao da Estrutura de Permissionamento

A estrutura atual de roles (`lead` / `full_access`) permanece completamente intacta:

| Funcionalidade | Lead | Full Access | Bloqueado |
|----------------|------|-------------|-----------|
| Dashboard      | Sim  | Sim         | Sim       |
| Nova Analise   | Sim  | Sim         | NAO       |
| Ver Analises   | Sim  | Sim         | Sim       |
| Gerenciar Vagas| NAO  | Sim         | (depende) |
| Formularios    | NAO  | Sim         | (depende) |
| Log Atividades | NAO  | Somente admin| NAO      |

O campo `is_blocked` afeta APENAS a capacidade de iniciar novas analises, nao as permissoes de visualizacao ou acesso a funcionalidades baseadas em role.

---

### Interface Visual

```text
+----------------------------------------------------------+
|  <- Log de Atividades                                     |
|                                                          |
|  [Atividades]  [Usuarios]                                |
|                =========                                  |
|                                                          |
|  Filtros: [Email...] [Empresa...] [Status: Todos v]      |
|                                                          |
|  152 usuarios encontrados                                |
|                                                          |
|  +------------------------------------------------------+|
|  | Nome   | Email   | Empresa | CVs  | Tokens | Saldo   ||
|  |--------|---------|---------|------|--------|---------|+
|  | Maria  | m@x.com | ACME    | 15   | 5000   | 5    [+]||
|  |        |         |         |      |        | [Block] ||
|  |--------|---------|---------|------|--------|---------|+
|  | Joao   | j@y.com | XYZ     | 0    | 0      | 10   [+]||
|  | [Apenas cadastro]|         |      |        | [Block] ||
|  |--------|---------|---------|------|--------|---------|+
|  | Ana    | a@z.com | ABC     | 8    | 3200   | 0 [!][+]||
|  | [BLOQUEADO]      |         |      |        |[Unbck] ||
|  +------------------------------------------------------+|
|                                                          |
|  Pagina 1 de 4                            [<] [>]        |
+----------------------------------------------------------+
```

---

### Fluxo de Bloqueio

1. Admin clica em "Bloquear" na linha do usuario
2. Dialog de confirmacao aparece: "Tem certeza que deseja bloquear este usuario?"
3. Ao confirmar, a funcao RPC `admin_update_user_profile` e chamada
4. Log de atividade e registrado com tipo `user_blocked`
5. Usuario aparece com badge "Bloqueado" na lista
6. Quando usuario tenta iniciar analise:
   - Frontend verifica `is_blocked` do perfil e exibe mensagem
   - Backend (Edge Function) tambem verifica antes de processar

---

### Passos de Implementacao

1. Criar migracao para adicionar coluna `is_blocked` e funcoes RPC
2. Criar componente `AddTokensDialog.tsx`
3. Criar componente `BlockUserDialog.tsx`
4. Criar componente `UserManagementTab.tsx` com tabela, filtros e paginacao
5. Modificar `ActivityLog.tsx` para usar Tabs e integrar os componentes
6. Adicionar verificacao de bloqueio em `Index.tsx` (handleAnalyze)
7. Adicionar verificacao de bloqueio em `JobPostingDetails.tsx`
8. Modificar Edge Function `analyze-resumes` para verificar bloqueio
9. Adicionar novos tipos de atividade: `user_blocked`, `user_unblocked`, `admin_add_resumes`
10. Atualizar hook `useActivityLog.ts` com os novos tipos

