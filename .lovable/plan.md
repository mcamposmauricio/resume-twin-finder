

## Plano de Correções e Melhorias

Sao 4 frentes de trabalho conforme solicitado:

---

### 1. Corrigir erro ao mover candidato de etapa

**Problema**: A tabela `job_applications` tem uma constraint CHECK que limita `triage_status` a apenas `['new', 'low_fit', 'deserves_analysis']`. Porem, as etapas do pipeline usam slugs como `'behavioral'`, `'technical_interview'`, `'proposal'` -- por isso o erro "violates check constraint".

**Solucao**: Remover a constraint CHECK via migracao SQL. O sistema ja usa etapas dinamicas definidas pelo usuario, entao restringir valores fixos nao faz sentido.

```sql
ALTER TABLE public.job_applications DROP CONSTRAINT job_applications_triage_status_check;
```

---

### 2. Revisar modais e textos que extrapolam o layout

**Arquivos a revisar**:
- `src/components/jobs/NewJobDialog.tsx` -- Ja corrigido em iteracoes anteriores. Verificar se ainda ha overflow nos templates com texto longo
- `src/components/jobs/ApplicationDetailPanel.tsx` -- Garantir que o Sheet nao tenha overflow de texto nos dados do formulario
- `src/components/jobs/ApplicationKanban.tsx` -- Cards no kanban com descricoes da vaga cortadas (visivel na screenshot: texto da vaga transbordando para a esquerda)

**Correcoes especificas**:
- Na pagina `JobPostingDetails.tsx`: adicionar `overflow-hidden` no container da descricao da vaga para evitar que textos longos extrapolem
- Nos cards do Kanban: garantir `overflow-hidden` e `max-w-full` nos containers de texto
- Na descricao da vaga exibida acima do kanban: aplicar `line-clamp` ou scroll para descricoes longas

---

### 3. Pagina de Acompanhamento de Vagas como pagina inicial para full_access

**Mudanca**: No `src/pages/Index.tsx`, quando o usuario e `full_access`, redirecionar automaticamente para `/vagas` (pagina de Acompanhamento de Vagas).

**Mudanca no `src/pages/JobPostings.tsx`**: Alterar o `statusFilter` default de `'draft'` para `'active'` para que abra mostrando as vagas publicadas.

---

### 4. Header e menu na pagina de Acompanhamento de Vagas

**Mudanca no `src/pages/JobPostings.tsx`**: Substituir o header atual (que tem botao de voltar) por um header completo similar ao da Index, com:
- Logo e nome do usuario
- Botao de logout
- Botao "+" com dropdown menu contendo:
  - Nova Vaga
  - Modelos de Formulario
  - Gerenciar Vagas (link para /vagas)
  - Configuracoes
  - Log de Atividades (somente para mauricio@marqponto.com.br)
- Manter o botao de "Nova Análise" que leva de volta a pagina principal (/)

**Arquivos alterados**:
- `supabase/migrations/` -- Nova migracao para dropar a CHECK constraint
- `src/pages/Index.tsx` -- Redirect para /vagas se full_access
- `src/pages/JobPostings.tsx` -- Default filter `'active'`, novo header com menu, buscar dados do perfil do usuario
- `src/pages/JobPostingDetails.tsx` -- Overflow fixes na descricao da vaga

