

## Plano: Logs de Erros no Sistema de Atividades + Prompt Reutilizável

### Visão Geral

Duas entregas:
1. Adicionar novos tipos de ação para erros no `useActivityLog` e instrumentar os pontos de falha existentes no código
2. Atualizar o painel de atividades para exibir erros visualmente (badge vermelha, filtro por erros)
3. Gerar um prompt reutilizável para replicar toda a estrutura de activity log em outros projetos Lovable

---

### 1. Mudanças no Banco de Dados

Adicionar coluna `is_error` na tabela `activity_logs` para facilitar filtro:

```sql
ALTER TABLE activity_logs ADD COLUMN is_error BOOLEAN DEFAULT false;
```

---

### 2. Novos Tipos de Ação (Erros)

Adicionar ao `useActivityLog.ts`:

| ActionType | Label |
|---|---|
| `login_error` | Erro no login |
| `signup_error` | Erro no cadastro |
| `analysis_error` | Erro na análise |
| `analysis_poll_error` | Erro no polling da análise |
| `job_create_error` | Erro ao criar vaga |
| `job_update_error` | Erro ao atualizar vaga |
| `job_publish_error` | Erro ao publicar vaga |
| `application_submit_error` | Erro ao enviar candidatura |
| `form_template_error` | Erro em formulário |
| `settings_save_error` | Erro ao salvar configurações |
| `draft_save_error` | Erro ao salvar rascunho |

---

### 3. Atualização da Função `logActivity`

- Aceitar novo parâmetro opcional `isError?: boolean`
- Quando `isError=true`, incluir `is_error: true` no insert
- O metadata já suporta dados livres, onde incluiremos `error_message` e `error_code`

---

### 4. Instrumentação dos Pontos de Erro

Arquivos a modificar para adicionar `logActivity` nos `catch` blocks:

**`src/pages/Auth.tsx`** - Erros de signup e login
**`src/pages/LoginHub.tsx`** - Erros de auto-login e login manual
**`src/pages/Index.tsx`** - Erros de análise (edge function, polling, draft save)
**`src/pages/JobPostingForm.tsx`** - Erros ao criar/editar vaga
**`src/pages/JobPostingDetails.tsx`** - Erros ao publicar/pausar/fechar vaga
**`src/pages/FormTemplateEditor.tsx`** - Erros em templates de formulário
**`src/pages/Settings.tsx`** - Erros ao salvar configurações
**`src/pages/PublicApplication.tsx`** - Erros ao enviar candidatura

Em cada catch, adicionar chamada como:
```typescript
logActivity({
  userId: user?.id || 'unknown',
  userEmail: user?.email || 'unknown',
  actionType: 'analysis_error',
  isError: true,
  metadata: {
    error_message: error.message,
    error_code: error.code,
    context: 'analyze-resumes edge function',
  },
});
```

---

### 5. Atualização do Painel de Atividades

**`src/pages/ActivityLog.tsx`:**

- Adicionar os novos tipos de erro na lista `ACTION_TYPES` do filtro
- Adicionar filtro rápido "Apenas erros" (checkbox ou botão toggle)
- Badge de erro: quando `is_error=true`, exibir a action_label com badge vermelha ao invés da azul padrão
- Na coluna "Detalhes", exibir `error_message` do metadata quando presente

---

### 6. Prompt Reutilizável

Ao final da implementacao, gerar um documento Markdown com o prompt completo para criar essa estrutura de activity log em qualquer projeto Lovable, incluindo:

- SQL de criacao da tabela `activity_logs` com RLS
- Codigo do hook `useActivityLog.ts`
- Instrucoes de instrumentacao
- Codigo da pagina `ActivityLog.tsx` completa
- Backfill retroativo a partir de tabelas existentes

---

### 7. Arquivos a Criar/Modificar

| Arquivo | Acao |
|---|---|
| `supabase/migrations/...` | Adicionar coluna `is_error` |
| `src/hooks/useActivityLog.ts` | Novos tipos de erro + param `isError` |
| `src/pages/ActivityLog.tsx` | Filtro de erros + badge vermelha |
| `src/pages/Auth.tsx` | Instrumentar catch blocks |
| `src/pages/LoginHub.tsx` | Instrumentar catch blocks |
| `src/pages/Index.tsx` | Instrumentar catch blocks |
| `src/pages/JobPostingForm.tsx` | Instrumentar catch blocks |
| `src/pages/JobPostingDetails.tsx` | Instrumentar catch blocks |
| `src/pages/FormTemplateEditor.tsx` | Instrumentar catch blocks |
| `src/pages/Settings.tsx` | Instrumentar catch blocks |
| `src/pages/PublicApplication.tsx` | Instrumentar catch blocks |
| `docs/activity-log-prompt.md` | Prompt reutilizavel para outros projetos |

