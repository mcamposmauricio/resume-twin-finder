

## Plano: Remover duplicatas e permitir exclusão de candidaturas

### Parte 1 — Identificar e remover candidaturas duplicadas (Lets Make)

Criar uma query de análise para encontrar duplicatas na tabela `job_applications` (mesmo `applicant_email` + mesmo `job_posting_id`, mantendo apenas a mais recente) e executar a remoção via SQL.

**SQL a executar via insert tool (data operation):**
```sql
DELETE FROM job_applications
WHERE id NOT IN (
  SELECT DISTINCT ON (job_posting_id, lower(applicant_email)) id
  FROM job_applications
  WHERE applicant_email IS NOT NULL
  ORDER BY job_posting_id, lower(applicant_email), created_at DESC
);
```

Antes de deletar, rodar uma query de análise para mostrar quantas duplicatas existem.

### Parte 2 — Adicionar botão de excluir candidatura

Precisa de uma RLS policy para DELETE (atualmente não existe) e ajustes em 4 componentes:

**1. Migration — RLS policy para DELETE:**
```sql
CREATE POLICY "Users can delete applications for their jobs"
ON public.job_applications
FOR DELETE
TO public
USING (job_posting_id IN (
  SELECT id FROM job_postings WHERE user_id = auth.uid()
));
```

**2. `useJobApplications.ts`** — Adicionar função `deleteApplication`:
- Chamar `supabase.from('job_applications').delete().eq('id', id)`
- Atualizar estado local removendo o item
- Retornar boolean de sucesso

**3. `ApplicationDetailPanel.tsx`** — Adicionar botão "Excluir candidatura":
- Receber `onDelete` callback via props
- Botão vermelho com confirmação (AlertDialog) na parte inferior do painel
- Ao confirmar, chamar `onDelete`, fechar painel

**4. `DraggableApplicationCard.tsx` / `ApplicationCard.tsx`** — Adicionar opção de excluir:
- Ícone de lixeira no hover do card (junto aos botões existentes de visualizar/currículo)
- Confirmação antes de deletar

**5. `ApplicationKanban.tsx`** — Receber e propagar `onDeleteApplication`

**6. `JobPostingDetails.tsx`** — Conectar tudo:
- Passar `deleteApplication` do hook para o Kanban e DetailPanel
- Após deletar, limpar `viewingApplication` se for o mesmo

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `job_applications` (RLS) | Nova policy DELETE |
| `useJobApplications.ts` | `deleteApplication()` |
| `ApplicationDetailPanel.tsx` | Botão excluir + confirmação |
| `ApplicationCard.tsx` | Ícone lixeira no hover |
| `ApplicationKanban.tsx` | Prop `onDeleteApplication` |
| `JobPostingDetails.tsx` | Conectar delete ao hook |

