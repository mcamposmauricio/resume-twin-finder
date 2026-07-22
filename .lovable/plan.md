# Migração Let's Make → novo projeto Lovable

Extrair as **38 vagas** (17 ativas, 20 fechadas, 1 pausada) e **2.189 candidaturas** (2.183 com CV, ~573 MB) da usuária `anne.caroline.osorio@gmail.com` para um novo projeto Lovable/Supabase, mantendo integridade referencial e sem perder dados.

## Estratégia de mapeamento de dono

No projeto destino a Anne já existe. Todos os `user_id` do SQL de import serão resolvidos **em tempo de execução** por email:

```sql
-- topo do script
\set target_email 'anne.caroline.osorio@gmail.com'
-- resolve UUID uma vez em uma CTE / variável psql:
SELECT id AS new_user_id FROM auth.users WHERE email = :'target_email' \gset
```

Todo `INSERT` usa `:'new_user_id'` no lugar do UUID antigo (`df2a4abf-...`). Se a coluna `company_name` estiver preenchida no perfil destino, o script não sobrescreve.

## O que será exportado (na ordem do SQL)

1. **`form_templates`** — os 3 templates usados pelas 38 vagas (`INSERT ... ON CONFLICT (id) DO NOTHING`, com `user_id = :new_user_id`).
2. **`pipeline_stages`** — as 8 etapas customizadas da Anne (idempotente por `(user_id, slug)`).
3. **`job_postings`** — 38 linhas preservando `id` original (para bater com o path dos CVs no Storage), `status`, `public_slug`, `form_template_id`, `company_*`, `brand_color`, timestamps.
4. **`job_applications`** — 2.189 linhas preservando `id`, `job_posting_id`, `form_data` (jsonb), `applicant_email/name`, `resume_url`, `resume_filename`, `status`, `triage_status`, `is_favorite`, `created_at`.

IDs originais são mantidos para: (a) o path dos CVs `{job_posting_id}/{uuid}.pdf` continuar válido, (b) links públicos `/apply/:slug` seguirem funcionando, (c) permitir re-rodar o script sem duplicar (`ON CONFLICT (id) DO NOTHING`).

## O que **não** vai no pacote

- `profiles` da Anne (já existe no destino).
- `user_roles`, `activity_logs`, `analyses`, `analysis_jobs`, `invites` (não pedidos, e alguns são específicos do projeto atual).
- Schema/DDL — o projeto destino já foi clonado com a estrutura correta.

## CVs (573 MB / 2.063 arquivos)

Edge function `export-letsmake-cvs` (temporária, restrita à Anne) lista `storage.objects` do bucket `resumes` cujo `name` começa com um dos 38 `job_posting_id`, baixa cada arquivo via service role e devolve um **ZIP em stream**. Rodada em lotes de ~200 arquivos para não estourar memória; o front concatena os ZIPs parciais em um único arquivo salvo em `/mnt/documents/letsmake-cvs.zip`.

No destino, um pequeno script Node incluído no ZIP faz upload de cada arquivo para o bucket `resumes` mantendo exatamente `{job_posting_id}/{filename}` — assim os `resume_url` importados batem sem reescrita.

## Entregável final

`/mnt/documents/letsmake-migration.zip` contendo:

```text
letsmake-migration/
├── README.md                    # passos numerados, ordem de execução, checklist
├── 01_import.sql                # idempotente, resolve user_id por email
├── cvs/                         # 2.063 PDFs em subpastas {job_id}/
└── scripts/
    └── upload-cvs.mjs           # script Node com @supabase/supabase-js
```

## Passos de execução (documentados no README)

1. No projeto destino, garantir que a Anne já fez login pelo menos uma vez (para existir em `auth.users`).
2. Confirmar que schema (tabelas `job_postings`, `job_applications`, `form_templates`, `pipeline_stages`) e o bucket privado `resumes` existem com as mesmas policies.
3. Rodar `01_import.sql` via SQL editor do novo projeto.
4. `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-cvs.mjs`.
5. Validar: contagens por tabela + amostragem de 5 candidaturas abrindo o CV assinado.

## Detalhes técnicos

- **Edge function nova (temporária):** `supabase/functions/export-letsmake-migration/index.ts` — gera o `01_import.sql` e a lista de CVs a baixar. Restrita ao email da Anne + ao dono atual (`mauricio@marqponto.com.br`). Deletada após a migração.
- **Front-end:** botão único em nova aba "Migração Let's Make" dentro de `ActivityLog.tsx` (só visível para os dois emails admin), com progresso em SSE similar ao `SystemExportTab`.
- **Idempotência:** todos os `INSERT` usam `ON CONFLICT (id) DO NOTHING`; re-execução parcial é segura.
- **`form_data` jsonb:** serializado com `jsonb_build_object` via `to_jsonb(...)` no export para evitar problemas de escape.
- **`resume_url`:** mantido como está (path relativo dentro do bucket `resumes`), não URL assinada — assim o novo projeto gera signed URLs próprias.
- **Tamanho:** ZIP final estimado em ~600 MB; se necessário, split em `cvs-part-01.zip`, `cvs-part-02.zip`.
