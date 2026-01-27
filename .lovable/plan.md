
# Plano: Backfill Retroativo do Log de Atividades

## Visão Geral

Preencher a tabela `activity_logs` com dados históricos existentes no sistema para que o log de atividades reflita todas as ações passadas desde o início da plataforma.

---

## Dados Disponíveis para Backfill

| Tabela | Registros | Período |
|--------|-----------|---------|
| profiles | 41 | Dez/2025 - Jan/2026 |
| analyses | 42 | Dez/2025 - Jan/2026 |
| job_postings | 18 | Jan/2026 |
| job_applications | 55 | Jan/2026 |
| form_templates | 3 | Jan/2026 |

---

## Mapeamento de Dados para Ações

### 1. Cadastro de Usuários (`user_signup`)
**Fonte:** `profiles`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  user_id,
  email,
  company_name,
  'user_signup',
  'Novo usuário cadastrado',
  'profile',
  id::text,
  jsonb_build_object('source', COALESCE(source, 'manual')),
  created_at
FROM profiles
WHERE email IS NOT NULL;
```

### 2. Análises Concluídas (`analysis_completed`)
**Fonte:** `analyses` WHERE `status = 'completed'`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  a.user_id,
  p.email,
  p.company_name,
  'analysis_completed',
  'Análise concluída',
  'analysis',
  a.id::text,
  jsonb_build_object('job_title', a.job_title, 'candidates_count', jsonb_array_length(a.candidates)),
  a.created_at
FROM analyses a
JOIN profiles p ON a.user_id = p.user_id
WHERE a.status = 'completed';
```

### 3. Rascunhos de Análise (`analysis_draft_saved`)
**Fonte:** `analyses` WHERE `status = 'draft'`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  a.user_id,
  p.email,
  p.company_name,
  'analysis_draft_saved',
  'Rascunho de análise salvo',
  'analysis',
  a.id::text,
  jsonb_build_object('job_title', a.job_title),
  a.created_at
FROM analyses a
JOIN profiles p ON a.user_id = p.user_id
WHERE a.status = 'draft';
```

### 4. Vagas Criadas (`job_created`)
**Fonte:** `job_postings` (todas, usando `created_at`)

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_created',
  'Vaga criada',
  'job_posting',
  jp.id::text,
  jsonb_build_object('title', jp.title, 'status', jp.status),
  jp.created_at
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id;
```

### 5. Vagas Publicadas (`job_published`)
**Fonte:** `job_postings` WHERE `status = 'active'`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_published',
  'Vaga publicada',
  'job_posting',
  jp.id::text,
  jsonb_build_object('title', jp.title),
  jp.created_at + interval '1 second'
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.status = 'active';
```

### 6. Vagas Pausadas (`job_paused`)
**Fonte:** `job_postings` WHERE `status = 'paused'`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_paused',
  'Vaga pausada',
  'job_posting',
  jp.id::text,
  jsonb_build_object('title', jp.title),
  jp.updated_at
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.status = 'paused';
```

### 7. Vagas Encerradas (`job_closed`)
**Fonte:** `job_postings` WHERE `status = 'closed'` OR `closed_at IS NOT NULL`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_closed',
  'Vaga encerrada',
  'job_posting',
  jp.id::text,
  jsonb_build_object('title', jp.title),
  COALESCE(jp.closed_at, jp.updated_at)
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.status = 'closed' OR jp.closed_at IS NOT NULL;
```

### 8. Vagas Analisadas (`application_analyzed`)
**Fonte:** `job_postings` WHERE `analyzed_at IS NOT NULL`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'application_analyzed',
  'Candidaturas enviadas para análise',
  'job_posting',
  jp.id::text,
  jsonb_build_object('title', jp.title),
  jp.analyzed_at
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.analyzed_at IS NOT NULL;
```

### 9. Candidaturas Recebidas (`application_received`)
**Fonte:** `job_applications`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'application_received',
  'Candidatura recebida',
  'job_application',
  ja.id::text,
  jsonb_build_object('applicant_name', ja.applicant_name, 'applicant_email', ja.applicant_email, 'job_title', jp.title),
  ja.created_at
FROM job_applications ja
JOIN job_postings jp ON ja.job_posting_id = jp.id
JOIN profiles p ON jp.user_id = p.user_id;
```

### 10. Templates de Formulário Criados (`form_template_created`)
**Fonte:** `form_templates`

```sql
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  ft.user_id,
  p.email,
  p.company_name,
  'form_template_created',
  'Modelo de formulário criado',
  'form_template',
  ft.id::text,
  jsonb_build_object('name', ft.name, 'fields_count', jsonb_array_length(ft.fields)),
  ft.created_at
FROM form_templates ft
JOIN profiles p ON ft.user_id = p.user_id;
```

---

## Resumo Esperado de Registros

| Ação | Registros Estimados |
|------|---------------------|
| `user_signup` | ~41 |
| `analysis_completed` | ~40 |
| `analysis_draft_saved` | ~2 |
| `job_created` | ~18 |
| `job_published` | ~10 (ativos) |
| `job_paused` | ~1 |
| `job_closed` | ~1 |
| `application_analyzed` | ~1 |
| `application_received` | ~55 |
| `form_template_created` | ~3 |
| **Total** | **~172 registros** |

---

## Implementação

### Arquivo: Migração SQL

Criar uma migração que executa todos os INSERTs de uma vez, inserindo os dados históricos na tabela `activity_logs`.

### Pontos Importantes

1. **Idempotência**: Os INSERTs são seguros para executar uma única vez (não há conflito de IDs)
2. **Timestamps preservados**: Usamos os `created_at` originais das tabelas fonte
3. **Metadados úteis**: Incluímos informações contextuais como título da vaga, nome do candidato, etc.
4. **Ordenação cronológica**: Os logs aparecem na ordem correta quando filtrados por data

---

## Arquivos a Modificar

| Ação | Arquivo |
|------|---------|
| **Criar** | Migração SQL para backfill |

