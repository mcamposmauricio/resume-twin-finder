# Exportação de Leads Enriquecida (CSV)

Nova aba dentro do menu **Atividades** (mesma restrição: `mauricio@marqponto.com.br`) que gera um único CSV com **um lead por linha** (`profiles.user_id`), cruzando todas as tabelas do banco que trazem informação sobre o lead.

## Onde vive

- **Frontend:** nova aba `Exportação de Leads` em `src/pages/ActivityLog.tsx`, ao lado de "Exportação Completa" e "Exportação CSV".
- **Componente:** `src/components/admin/LeadsExportTab.tsx` — botão único "Gerar CSV de Leads", barra de progresso, log em tempo real (mesmo padrão visual do `SystemCsvExportTab`).
- **Backend:** nova edge function `supabase/functions/leads-export/index.ts` (`verify_jwt = true`), valida email admin, monta o CSV em streaming SSE (`progress` / `log` / `done` com URL assinada em `system-exports/leads/leads-YYYYMMDD-HHmm.csv`, 24h).

## Colunas do CSV (uma linha por lead)

Bloco **Identidade** (profiles + auth.users)
- user_id, email, name, phone, cargo, company_name, employee_count
- source (manual/hr_hub/…), hr_hub_user_id, lead_source, referral_code, referred_by_code
- is_blocked, show_marq_banner, total_resumes
- created_at, updated_at
- auth_last_sign_in_at, auth_email_confirmed_at, auth_provider (de `auth.users.raw_app_meta_data->>'provider'`)

Bloco **Papel & acesso** (user_roles)
- role (lead/full_access/…), is_full_access, is_admin_email

Bloco **Marca / Página de carreiras** (profiles)
- careers_page_enabled, careers_page_slug, company_website, company_linkedin, company_instagram, company_whatsapp, company_youtube, company_tiktok, company_glassdoor
- has_logo (bool derivado de company_logo_url), brand_color
- has_about, has_mission, has_vision, has_values, has_culture, benefits_count (jsonb length)

Bloco **Uso — Análises** (analyses)
- analyses_total, analyses_completed, analyses_last_at
- tokens_used_total, resumes_analyzed_total (soma de `jsonb_array_length(candidates)`)

Bloco **Uso — Vagas** (job_postings)
- jobs_total, jobs_draft, jobs_active, jobs_paused, jobs_closed
- jobs_first_created_at, jobs_last_created_at
- careers_public_jobs (ativas com slug público)

Bloco **Uso — Candidaturas recebidas** (job_applications via job_postings.user_id)
- applications_total, applications_last_at
- applications_new, applications_low_fit, applications_deserves_analysis
- applications_with_resume, applications_favorited
- unique_candidates (distinct lower(applicant_email))

Bloco **Templates & Pipeline**
- form_templates_count, job_templates_count, pipeline_stages_count

Bloco **Atividade & convites**
- activity_logs_count, activity_logs_last_at
- invites_sent

Bloco **Derivados / scoring**
- days_since_signup, days_since_last_activity (max de analyses/jobs/applications/activity)
- engagement_score: `0` sem uso · `1` só cadastro + login · `2` criou vaga OU análise · `3` recebeu candidatura · `4` >10 candidaturas ou >3 vagas ativas

## Como o backend monta

Uma única query SQL com CTEs agregando cada bloco por `user_id`, `LEFT JOIN` em `profiles`. Roda via service role para ler `auth.users` e ignorar RLS. Escreve o CSV em memória (UTF-8 + BOM, aspas duplas escapadas), envia progresso a cada bloco processado, sobe no bucket `system-exports` e devolve signed URL.

## Detalhes técnicos

- Reaproveita padrão SSE, autenticação e UI do `SystemCsvExportTab` existente.
- Registro em `activity_logs` (`action: 'leads_export'`, metadata com contagem de linhas).
- Sem mudanças de schema, sem migrations.
- `supabase/config.toml`: adicionar `[functions.leads-export] verify_jwt = true`.
- Nenhuma alteração em fluxos existentes.

## Fora do escopo

- Filtros por período/origem (usuário pediu "mais completo possível" — exporta tudo).
- Exportar candidatos como linhas (leads = profiles conforme resposta).
- Alterar exportações já existentes.
