
# Menu "Atividades" + Exportação Completa do Sistema

## 1. Tornar "Atividades" visível no menu lateral

**Arquivo:** `src/components/layout/AppSidebar.tsx`

- Adicionar item "Atividades" (ícone `Activity`, rota `/atividades`) ao `mainItems`, mas renderizado condicionalmente apenas quando `userEmail === 'mauricio@marqponto.com.br'` (vindo do `useAuth()`).
- Demais admins (`marco@marqponto.com.br`) continuam acessando via URL direta — apenas o Mauricio vê o item no menu, conforme pedido.

## 2. Nova aba "Exportação Completa do Sistema"

**Arquivo:** `src/pages/ActivityLog.tsx`

- Adicionar terceira `TabsTrigger` "Exportação Completa do Sistema" ao lado de Usuários/Atividades.
- A aba só é renderizada se `user.email === 'mauricio@marqponto.com.br'` (validação dupla além do guard de página).
- Conteúdo: card com descrição, botão único "Gerar Exportação Completa", barra de progresso (`<Progress />`) e área de log em tempo real (lista de mensagens com timestamp).
- Ao clicar, chama a edge function `system-full-export` e faz streaming dos logs (Server-Sent Events ou polling de status simples). Ao finalizar, baixa o `.zip` automaticamente.

**Novo componente:** `src/components/admin/SystemExportTab.tsx`

## 3. Edge Function `system-full-export`

**Arquivo:** `supabase/functions/system-full-export/index.ts` (com `verify_jwt = true`)

Validação de segurança (dupla):
1. Verifica JWT do chamador via `supabase.auth.getUser(token)`.
2. Confirma que `user.email === 'mauricio@marqponto.com.br'`. Qualquer outro retorna `403`.

Conteúdo do `.zip` gerado (usando `jszip` via `npm:jszip`):

```text
export-YYYYMMDD-HHmm.zip
├── README.md                          ← instruções gerais
├── PROMPT_RECONSTRUCAO_COMPLETA.md    ← prompt IA: recriar do zero
├── PROMPT_RESTAURAR_NO_SUPABASE.md    ← prompt IA: restaurar backend num Supabase novo a partir do código já existente
├── database/
│   ├── schema.sql                     ← CREATE TABLE/INDEX/ENUM/VIEW/TRIGGER/FUNCTION/POLICY
│   ├── seed.sql                       ← INSERT de todas as tabelas públicas
│   └── tables/*.json                  ← dump JSON por tabela (backup paralelo)
├── edge-functions/
│   └── <function>/index.ts            ← código-fonte de cada função
├── storage/
│   ├── manifest.json                  ← lista de buckets + arquivos + paths
│   └── files/<bucket>/<path>          ← bytes baixados (resumes, company-assets)
├── config/
│   ├── supabase-config.toml
│   ├── auth-settings.json             ← providers, redirects, hibp etc.
│   ├── buckets.json
│   └── secrets-required.txt           ← apenas NOMES dos secrets (sem valores)
└── frontend/
    └── MANIFEST.md                    ← lista de dependências (package.json) + nota para usar o repositório fonte
```

Como cada parte é coletada:

- **Schema/RLS/Functions/Triggers/Views**: queries no `information_schema` e `pg_catalog` via `service_role` para reconstruir DDL (tabelas, colunas, defaults, FKs, índices, enums, policies via `pg_policies`, funções via `pg_proc`, triggers via `pg_trigger`).
- **Dados**: `SELECT *` em cada tabela do schema `public`, serializado tanto como `INSERT` (seed.sql) quanto JSON.
- **Edge Functions**: lidas do filesystem do projeto **não é possível em runtime**. Solução: incluir lista de funções existentes + nota no README explicando que o código-fonte vive no repositório frontend (`supabase/functions/`) que deve ser exportado junto. Adicional: listar via Management API se `SUPABASE_ACCESS_TOKEN` estiver configurado (opcional, pode ficar como TODO).
- **Storage**: `supabase.storage.listBuckets()` + `list()` recursivo + `download()` de cada arquivo, anexado ao zip.
- **Auth/config**: dump do `supabase/config.toml` não acessível em runtime → incluir apenas referência. Settings de auth via Management API quando disponível.
- **Logs e progresso**: a função emite SSE (`text/event-stream`) com mensagens `{step, percent, message}` durante a coleta. No fim, envia evento `done` com URL assinada de download (arquivo subido para bucket privado temporário `system-exports/`).

Limitações honestas a comunicar no UI e no README do zip:
- Código-fonte das edge functions e do frontend deve ser obtido do repositório (não exposto em runtime).
- Secrets nunca são exportados — apenas seus nomes.
- Configurações de auth fora do alcance do `service_role` precisam ser reconfiguradas manualmente; um checklist é gerado no `PROMPT_RESTAURAR_NO_SUPABASE.md`.

## 4. Bucket de exportação

Migration:
- Criar bucket privado `system-exports` (não público).
- Policy: apenas service_role (sem policies públicas) — acesso só via signed URL gerada pela edge function.

## 5. Prompts gerados (templates)

`PROMPT_RECONSTRUCAO_COMPLETA.md` — instrui a IA a:
- Criar projeto React/Vite + Tailwind + shadcn idêntico
- Habilitar Lovable Cloud / Supabase novo
- Rodar `database/schema.sql` e `database/seed.sql`
- Deployar todas as edge functions listadas em `edge-functions/`
- Recriar buckets de `config/buckets.json` e fazer upload de `storage/files/`
- Configurar auth conforme `config/auth-settings.json`
- Adicionar secrets listados em `config/secrets-required.txt`
- Preservar multi-tenant via `user_id` em RLS, roles em `user_roles`

`PROMPT_RESTAURAR_NO_SUPABASE.md` — para quem já tem o código:
- Apenas conectar a um Supabase novo, rodar schema + seed, deploy de functions, restaurar storage, configurar secrets/auth.

## 6. Segurança (defesa em profundidade)

- Frontend: aba e item de menu condicionados ao email.
- Página `ActivityLog`: já redireciona não-admin; reforçar bloqueio de aba para email != Mauricio.
- Edge function: valida JWT + email no servidor; service_role nunca exposto ao cliente.
- Bucket `system-exports` privado; download apenas via signed URL com TTL de 1h.
- Log da exportação em `activity_logs` (`action_type: 'system_full_export'`).

## Arquivos a criar / editar

Editar:
- `src/components/layout/AppSidebar.tsx` — item "Atividades" condicional
- `src/pages/ActivityLog.tsx` — terceira aba

Criar:
- `src/components/admin/SystemExportTab.tsx`
- `supabase/functions/system-full-export/index.ts`
- `supabase/config.toml` — bloco da nova função (verify_jwt = true)
- Migration: bucket `system-exports` + policies + log activity_type
