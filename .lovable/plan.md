

## Plano: Vincular candidato do Banco de Talentos a uma vaga ativa

### Conceito

Adicionar um botão "Vincular a uma vaga" no painel de detalhes do candidato (`TalentDetailPanel`). Ao clicar, abre um dialog com a lista de vagas ativas do tenant. Ao selecionar uma vaga, o sistema cria uma nova `job_application` com os dados do candidato (nome, email, telefone, currículo mais recente, form_data), vinculando-o àquela vaga.

### Fluxo

1. Recrutador abre o painel lateral de um candidato
2. Clica em "Vincular a uma vaga"
3. Dialog exibe vagas ativas (filtráveis por título)
4. Seleciona a vaga desejada
5. Sistema verifica se já existe candidatura do mesmo email nessa vaga (via `check_duplicate_application` que já existe)
6. Se não duplicado, insere nova `job_application` com `triage_status: 'new'` e os dados do candidato
7. Toast de sucesso com link para a vaga

### Arquivos

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/components/talent/LinkToJobDialog.tsx` | Criar | Dialog com lista de vagas ativas, busca, seleção e confirmação |
| `src/components/talent/TalentDetailPanel.tsx` | Editar | Adicionar botão "Vincular a uma vaga" e integrar o dialog |
| `src/hooks/useTalentPool.ts` | Editar | Adicionar função `linkTalentToJob` que faz o insert na `job_applications` |

### Detalhes do `LinkToJobDialog`

- Recebe: `talent` (email, name, phone, latest_resume_url, latest_resume_filename), `userId`, callback `onSuccess`
- Busca vagas ativas do usuário (`job_postings` where `user_id = userId` and `status = 'active'`)
- Input de busca para filtrar vagas por título
- Ao confirmar:
  1. Chama RPC `check_duplicate_application(job_posting_id, email)` — se true, mostra erro "Candidato já aplicou nesta vaga"
  2. Insere em `job_applications`: `job_posting_id`, `applicant_email`, `applicant_name`, `resume_url`, `resume_filename`, `triage_status: 'new'`, `status: 'pending'`, `form_data: {}` (vazio, pois é vinculação manual)
  3. Toast de sucesso

### Sem migração necessária

- Usa tabelas e RLS existentes (`job_applications` INSERT permitido para vagas ativas — porém a vaga precisa estar ativa, o que é o caso)
- Usa `check_duplicate_application` RPC existente para evitar duplicatas

