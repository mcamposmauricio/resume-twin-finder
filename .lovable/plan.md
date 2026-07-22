# Migração Let's Make por link — nada de anexo no chat

Nova abordagem: o Lovable de destino recebe **um único link** (endpoint HTTP deste projeto) e um **token de acesso**. Ele mesmo baixa o SQL, o manifesto e os ~1.777 PDFs direto do bucket, em paralelo. Sem ZIP, sem anexo.

## Como fica o fluxo

```
[Projeto origem]                              [Projeto destino — Lovable]
─────────────────                             ────────────────────────────
Edge function `letsmake-migration-index`
  GET  /?scope=open                 ─────►    fetch(indexUrl, {x-migration-token})
     retorna:                                 → recebe migration_index.json
     {
       sql_url,        (signed 7d)     ◄─────
       manifest_url,   (signed 7d)
       cvs: [{path, url, size}, ...],  (URLs assinadas 7d)
       external_urls: [...]            (Azure, já absolutas)
     }
                                              baixa sql_url, roda no destino
                                              itera cvs[] em paralelo:
                                                fetch(cv.url) → upload no bucket
                                                             `resumes/{job_id}/{filename}`
                                              lê external_urls[] (só metadata,
                                                nada a baixar)
```

Tudo servido pela infra de Storage do Supabase de origem via signed URLs de 7 dias (máx do Storage). Se expirar, basta re-chamar o índice: um único GET regenera todas as URLs.

## O que será entregue

**Ao final, você recebe apenas um bloco de texto pronto para colar no chat do outro Lovable**, contendo:

1. A URL do endpoint de índice (`https://<project>.functions.supabase.co/letsmake-migration-index?scope=open`).
2. O token de acesso (`x-migration-token`).
3. Instruções claras para o agente de destino: fetch → SQL → download+upload em paralelo → validação.

Nada em `/mnt/documents`, nada de anexo. É só copiar e colar.

## Escopo

Padrão: **`scope=open`** — 18 vagas ativas/pausadas da Anne, 1.800 candidaturas, ~1.777 PDFs internos + 22 URLs externas. Suporta `scope=all` também, caso você mude de ideia.

## Passos que serão executados (build mode)

1. **Escolher e salvar o token compartilhado** via `generate_secret` como `LETSMAKE_MIGRATION_TOKEN` (32 chars, aleatório, nunca revelado no chat — o agente destino recebe o valor gerado uma única vez no bloco final).
2. **Criar edge function `letsmake-migration-index`** em `supabase/functions/letsmake-migration-index/index.ts`:
   - CORS liberado.
   - Autenticação por header `x-migration-token` (compara com `LETSMAKE_MIGRATION_TOKEN`). Sem match → 401.
   - Query `?scope=open|all` (default `open`).
   - Resolve os `job_posting_id` da Anne (`user_id = 'df2a4abf-…'`) filtrando por status.
   - Gera `01_import.sql` **dinamicamente** consultando `form_templates`, `pipeline_stages`, `job_postings`, `job_applications` com `ON CONFLICT DO NOTHING` e placeholder que resolve `user_id` por email `anne.caroline.osorio@gmail.com`. Faz upload em `system-exports/letsmake/{scope}/01_import.sql`, retorna signed URL 7d.
   - Gera `manifest.json` com `{ job_posting_id, filename, storage_path, size, is_external }` para todas as candidaturas do escopo. Upload em `system-exports/letsmake/{scope}/manifest.json`, signed URL 7d.
   - Lista objetos do bucket `resumes` cujo prefixo bate com os job_ids do escopo (paginado, 1000 em 1000).
   - Chama `storage.from('resumes').createSignedUrls(paths, 604800)` em lotes de 100.
   - Devolve JSON:
     ```json
     {
       "scope": "open",
       "generated_at": "2026-…",
       "expires_in_days": 7,
       "sql_url": "https://…",
       "manifest_url": "https://…",
       "target_email": "anne.caroline.osorio@gmail.com",
       "counts": { "jobs": 18, "applications": 1800, "cvs_internal": 1777, "cvs_external": 22 },
       "cvs": [ { "job_posting_id": "…", "filename": "…", "storage_path": "…/…pdf", "url": "https://…", "size": 123456 } ],
       "external_urls": [ { "application_id": "…", "url": "https://…" } ]
     }
     ```
3. **Testar** com `supabase--curl_edge_functions`: chamar com token, conferir contagens e uma signed URL de amostra (fazendo `HEAD` para validar 200).
4. **Montar o prompt final** para o chat do Lovable destino com: URL do índice, token, instruções passo a passo (fetch, rodar SQL, loop de download/upload com concorrência 20 e retry x3, path exato `{job_posting_id}/{filename}`, validação de contagens no fim).
5. **Deixar a function publicada** até a migração terminar. Combinamos deletar depois (function + secret + arquivos em `system-exports/letsmake/`).

## Detalhes técnicos

- Nenhum ZIP, nenhum arquivo em `/mnt/documents`. Toda a persistência intermediária vai para o bucket privado `system-exports` que já existe.
- Signed URL cap = 7 dias. Se o processo de migração levar mais tempo, um novo GET no índice regera tudo.
- `createSignedUrls` aceita ~100 paths por chamada → paginação interna.
- SQL gerado é idempotente (`ON CONFLICT (id) DO NOTHING/UPDATE`), preserva `id` de vagas/candidaturas, resolve `user_id` por email em runtime.
- Nenhuma alteração de schema ou de dados no projeto origem.
- Segurança: token via `generate_secret` (não fica no repo, não aparece no chat depois do bloco final), escopo travado ao `user_id` da Anne dentro da function, endpoint só devolve dados dela.
- Se quiser rotacionar/invalidar acesso a qualquer momento: `update_secret` no `LETSMAKE_MIGRATION_TOKEN` e o link para de funcionar.

## Fora de escopo

- Signup/autenticação real (basta o token compartilhado — mesmo padrão já usado no `letsmake-signed-urls` anterior).
- Vagas encerradas (default `scope=open`).
- Alterações no projeto destino — isso vai no prompt final que você cola lá.
