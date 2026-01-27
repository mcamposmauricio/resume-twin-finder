-- Backfill activity_logs with historical data

-- 1. User signups from profiles
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  user_id,
  email,
  company_name,
  'user_signup',
  'Novo usuário cadastrado',
  'profile',
  id,
  jsonb_build_object('source', COALESCE(source, 'manual')),
  created_at
FROM profiles
WHERE email IS NOT NULL;

-- 2. Completed analyses
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  a.user_id,
  p.email,
  p.company_name,
  'analysis_completed',
  'Análise concluída',
  'analysis',
  a.id,
  jsonb_build_object('job_title', a.job_title, 'candidates_count', jsonb_array_length(a.candidates)),
  a.created_at
FROM analyses a
JOIN profiles p ON a.user_id = p.user_id
WHERE a.status = 'completed';

-- 3. Draft analyses
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  a.user_id,
  p.email,
  p.company_name,
  'analysis_draft_saved',
  'Rascunho de análise salvo',
  'analysis',
  a.id,
  jsonb_build_object('job_title', a.job_title),
  a.created_at
FROM analyses a
JOIN profiles p ON a.user_id = p.user_id
WHERE a.status = 'draft';

-- 4. Job postings created
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_created',
  'Vaga criada',
  'job_posting',
  jp.id,
  jsonb_build_object('title', jp.title, 'status', jp.status),
  jp.created_at
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id;

-- 5. Jobs published (active status)
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_published',
  'Vaga publicada',
  'job_posting',
  jp.id,
  jsonb_build_object('title', jp.title),
  jp.created_at + interval '1 second'
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.status = 'active';

-- 6. Jobs paused
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_paused',
  'Vaga pausada',
  'job_posting',
  jp.id,
  jsonb_build_object('title', jp.title),
  jp.updated_at
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.status = 'paused';

-- 7. Jobs closed
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'job_closed',
  'Vaga encerrada',
  'job_posting',
  jp.id,
  jsonb_build_object('title', jp.title),
  COALESCE(jp.closed_at, jp.updated_at)
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.status = 'closed' OR jp.closed_at IS NOT NULL;

-- 8. Jobs analyzed
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'application_analyzed',
  'Candidaturas enviadas para análise',
  'job_posting',
  jp.id,
  jsonb_build_object('title', jp.title),
  jp.analyzed_at
FROM job_postings jp
JOIN profiles p ON jp.user_id = p.user_id
WHERE jp.analyzed_at IS NOT NULL;

-- 9. Applications received
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  jp.user_id,
  p.email,
  p.company_name,
  'application_received',
  'Candidatura recebida',
  'job_application',
  ja.id,
  jsonb_build_object('applicant_name', ja.applicant_name, 'applicant_email', ja.applicant_email, 'job_title', jp.title),
  ja.created_at
FROM job_applications ja
JOIN job_postings jp ON ja.job_posting_id = jp.id
JOIN profiles p ON jp.user_id = p.user_id;

-- 10. Form templates created
INSERT INTO activity_logs (user_id, user_email, company_name, action_type, action_label, entity_type, entity_id, metadata, created_at)
SELECT 
  ft.user_id,
  p.email,
  p.company_name,
  'form_template_created',
  'Modelo de formulário criado',
  'form_template',
  ft.id,
  jsonb_build_object('name', ft.name, 'fields_count', jsonb_array_length(ft.fields)),
  ft.created_at
FROM form_templates ft
JOIN profiles p ON ft.user_id = p.user_id;