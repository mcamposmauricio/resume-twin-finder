
# Plano: Log de Atividades (Admin Only)

## Visão Geral

Implementar um sistema de log de atividades visível **apenas** para `mauricio@marqponto.com.br`. O log registrará todas as ações relevantes dos usuários na plataforma e permitirá filtros avançados.

---

## 1. Estrutura do Banco de Dados

### Nova Tabela: `activity_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `user_id` | uuid | ID do usuário que realizou a ação |
| `user_email` | text | Email do usuário (para filtros) |
| `company_name` | text | Nome da empresa (para filtros) |
| `action_type` | text | Tipo da ação |
| `action_label` | text | Descrição legível da ação |
| `entity_type` | text | Tipo da entidade (analysis, job_posting, etc.) |
| `entity_id` | uuid | ID da entidade relacionada |
| `metadata` | jsonb | Dados adicionais (opcional) |
| `created_at` | timestamptz | Data/hora da ação |

### Tipos de Ação a Registrar

| action_type | Descrição |
|-------------|-----------|
| `user_signup` | Novo usuário criado |
| `user_login` | Login realizado |
| `analysis_started` | Análise iniciada |
| `analysis_completed` | Análise concluída |
| `analysis_draft_saved` | Rascunho salvo |
| `job_created` | Vaga criada |
| `job_published` | Vaga publicada |
| `job_paused` | Vaga pausada |
| `job_resumed` | Vaga reativada |
| `job_closed` | Vaga encerrada |
| `job_edited` | Vaga editada |
| `application_received` | Candidatura recebida |
| `application_analyzed` | Candidaturas enviadas para análise |
| `application_triage_updated` | Status de triagem atualizado |
| `form_template_created` | Modelo de formulário criado |
| `form_template_updated` | Modelo de formulário atualizado |
| `form_template_deleted` | Modelo de formulário excluído |
| `referral_bonus` | Bônus de indicação aplicado |

### RLS Policies

```sql
-- Apenas usuários autenticados podem inserir logs (qualquer um)
CREATE POLICY "Anyone can insert logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Apenas mauricio@marqponto.com.br pode visualizar
CREATE POLICY "Only admin can view logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'mauricio@marqponto.com.br'
);
```

---

## 2. Hook de Logging

### Novo arquivo: `src/hooks/useActivityLog.ts`

```typescript
export function useActivityLog() {
  const logActivity = async (params: {
    userId: string;
    userEmail: string;
    companyName?: string;
    actionType: string;
    actionLabel: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  }) => {
    await supabase.from('activity_logs').insert({
      user_id: params.userId,
      user_email: params.userEmail,
      company_name: params.companyName,
      action_type: params.actionType,
      action_label: params.actionLabel,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata,
    });
  };

  return { logActivity };
}
```

---

## 3. Integração do Logging nos Componentes

### Arquivos a modificar:

| Arquivo | Ações a logar |
|---------|---------------|
| `src/pages/Auth.tsx` | `user_signup`, `user_login` |
| `src/pages/Index.tsx` | `analysis_started`, `analysis_completed`, `analysis_draft_saved` |
| `src/pages/JobPostingForm.tsx` | `job_created`, `job_published`, `job_edited` |
| `src/pages/JobPostingDetails.tsx` | `job_paused`, `job_resumed`, `job_closed`, `application_analyzed` |
| `src/hooks/useJobApplications.ts` | `application_triage_updated` |
| `src/pages/FormTemplateEditor.tsx` | `form_template_created`, `form_template_updated` |
| `src/pages/PublicApplication.tsx` | `application_received` |

---

## 4. Nova Página: Log de Atividades

### Arquivo: `src/pages/ActivityLog.tsx`

**Funcionalidades:**
- Listagem paginada de atividades
- Filtros:
  - Por empresa (dropdown ou texto)
  - Por email (texto)
  - Por tipo de ação (dropdown multi-select)
  - Por data:
    - Dia único (date picker)
    - Período (date range picker)
- Exibição em tabela com colunas:
  - Data/Hora
  - Usuário (email)
  - Empresa
  - Ação
  - Detalhes

**Proteção de Acesso:**
```typescript
// Verificar se é o admin
if (user?.email !== 'mauricio@marqponto.com.br') {
  navigate('/');
  return null;
}
```

---

## 5. Adição ao Menu (Dashboard)

### Arquivo: `src/components/Dashboard.tsx`

Adicionar opção no dropdown menu **apenas** se o email for `mauricio@marqponto.com.br`:

```typescript
{user?.email === 'mauricio@marqponto.com.br' && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => navigate('/atividades')} className="cursor-pointer py-3">
      <Activity className="w-4 h-4 mr-3 text-orange-600" />
      <span>Log de Atividades</span>
    </DropdownMenuItem>
  </>
)}
```

---

## 6. Rota Protegida

### Arquivo: `src/App.tsx`

```typescript
<Route path="/atividades" element={<ActivityLog />} />
```

A proteção ocorre dentro do componente `ActivityLog.tsx`, redirecionando usuários não autorizados.

---

## 7. Componentes de UI

### Filtros de Data

Usar o componente `Calendar` do Shadcn com:
- Modo `single` para dia único
- Modo `range` para período

### Filtro de Ações

Dropdown com checkboxes para seleção múltipla dos tipos de ação.

### Tabela de Resultados

Usar componente `Table` do Shadcn com paginação.

---

## Resumo dos Arquivos

| Ação | Arquivo |
|------|---------|
| **Criar** | `src/pages/ActivityLog.tsx` |
| **Criar** | `src/hooks/useActivityLog.ts` |
| **Modificar** | `src/App.tsx` (adicionar rota) |
| **Modificar** | `src/components/Dashboard.tsx` (adicionar menu) |
| **Modificar** | `src/pages/Auth.tsx` (logar signup/login) |
| **Modificar** | `src/pages/Index.tsx` (logar análises) |
| **Modificar** | `src/pages/JobPostingForm.tsx` (logar vagas) |
| **Modificar** | `src/pages/JobPostingDetails.tsx` (logar ações de vaga) |
| **Modificar** | `src/pages/FormTemplateEditor.tsx` (logar templates) |
| **Modificar** | `src/pages/PublicApplication.tsx` (logar candidaturas) |
| **Modificar** | `src/hooks/useJobApplications.ts` (logar triagem) |
| **Migração** | Criar tabela `activity_logs` com RLS |

---

## Detalhes Técnicos

### Segurança
- A verificação de acesso é feita tanto no frontend (ocultar menu) quanto no backend (RLS policy)
- Apenas `mauricio@marqponto.com.br` pode visualizar os logs
- Qualquer usuário autenticado pode inserir logs (necessário para registrar ações)

### Performance
- Índices na tabela: `user_email`, `company_name`, `action_type`, `created_at`
- Paginação padrão: 50 registros por página
- Query otimizada com filtros aplicados no servidor

### Filtros de Data
- Dia único: filtra por `created_at::date = 'YYYY-MM-DD'`
- Período: filtra por `created_at >= start AND created_at <= end`
