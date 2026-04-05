

## Plano: Banco de Talentos por Tenant + Histórico de Aplicações

### Conceito

Criar uma nova seção "Banco de Talentos" acessível no menu principal, que consolida todos os candidatos únicos (por email) que se candidataram via `/apply` nas vagas do tenant. Cada candidato mostra seus dados, currículo mais recente e o histórico completo de aplicações em vagas.

### Arquitetura

Não é necessário criar novas tabelas. Os dados já existem em `job_applications` + `job_postings`. A feature será uma **view do frontend** que agrupa candidaturas por `applicant_email`.

```text
job_applications (existente)
  ├── applicant_email  ← chave de agrupamento
  ├── applicant_name
  ├── resume_url
  ├── job_posting_id   → job_postings.title (nome da vaga)
  ├── triage_status
  ├── created_at
  └── form_data
```

### Componentes e Arquivos

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/pages/TalentPool.tsx` | Criar | Página principal do banco de talentos |
| `src/hooks/useTalentPool.ts` | Criar | Hook que busca todas as candidaturas do tenant, agrupa por email e retorna lista de talentos |
| `src/components/talent/TalentCard.tsx` | Criar | Card de cada candidato com nome, email, qtd de aplicações, última vaga |
| `src/components/talent/TalentDetailPanel.tsx` | Criar | Sheet lateral com dados completos + histórico de aplicações (vaga, data, etapa) |
| `src/App.tsx` | Editar | Adicionar rota `/banco-de-talentos` |
| `src/pages/JobPostings.tsx` | Editar | Adicionar link "Banco de Talentos" no menu |
| `src/components/Dashboard.tsx` | Editar | Adicionar card de stat "Total de Talentos" e link rápido |

### Funcionalidades

**Página `/banco-de-talentos`**
- Lista de candidatos únicos (agrupados por email)
- Busca por nome/email
- Filtro por vaga aplicada
- Contagem total de talentos
- Ordenação por data da última aplicação

**Card do Candidato**
- Nome e email
- Número de aplicações
- Última vaga aplicada + data
- Badge com etapa atual mais recente

**Painel de Detalhes (Sheet lateral)**
- Dados do candidato (nome, email, telefone se disponível no form_data)
- Currículo mais recente (preview + download)
- **Histórico de aplicações**: tabela com colunas (Vaga, Data, Etapa) — cada linha mostra o título da vaga, data da candidatura e o stage atual
- Dados do formulário da última aplicação

### Lógica do Hook `useTalentPool`

1. Buscar todas as `job_applications` das vagas do usuário logado (via join com `job_postings.user_id`)
2. Buscar os títulos das vagas associadas
3. Agrupar por `applicant_email` (lowercase)
4. Para cada grupo, montar objeto com: nome (mais recente), email, lista de aplicações com título da vaga, data e status

### Detalhes Técnicos

- A query usa o RLS existente (candidaturas de vagas do tenant)
- Sem nova tabela nem migração
- Acesso restrito a `full_access` (mesmo padrão das vagas)
- Rota protegida como `/vagas`

