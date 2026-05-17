// System-wide export edge function — restricted to mauricio@marqponto.com.br
// Generates a ZIP with DB schema, data, RLS, functions, triggers, storage files, and AI prompts.

import { createClient } from "npm:@supabase/supabase-js@2";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_EMAIL = "mauricio@marqponto.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // --- AuthZ ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (userData.user.email !== ALLOWED_EMAIL) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // --- SSE stream ---
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const log = (message: string, level: "info" | "success" | "error" = "info") =>
        send({ type: "log", message, level });
      const progress = (percent: number, message: string) => send({ type: "progress", percent, message });

      try {
        const zip = new JSZip();
        const startedAt = new Date();
        const stamp = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 16);

        progress(2, "Iniciando exportação completa...");

        // --- 1. DB schema introspection via SQL ---
        progress(5, "Coletando schema do banco de dados...");
        const schemaSQL = await buildSchemaSQL(admin, log);
        zip.file("database/schema.sql", schemaSQL);
        progress(20, "Schema do banco coletado.");

        // --- 2. Table data ---
        progress(25, "Exportando dados das tabelas...");
        const { seedSQL, tableFiles, tableCount, rowCount } = await dumpTables(admin, log);
        zip.file("database/seed.sql", seedSQL);
        for (const [name, json] of Object.entries(tableFiles)) {
          zip.file(`database/tables/${name}.json`, json);
        }
        log(`${tableCount} tabelas, ${rowCount} linhas exportadas`, "success");
        progress(55, "Dados das tabelas exportados.");

        // --- 3. Storage ---
        progress(60, "Exportando arquivos do storage...");
        const storageManifest = await dumpStorage(admin, zip, log);
        zip.file("storage/manifest.json", JSON.stringify(storageManifest, null, 2));
        progress(80, "Storage exportado.");

        // --- 4. Edge functions listing ---
        progress(82, "Listando edge functions...");
        const fnList = await listEdgeFunctions(admin);
        zip.file("edge-functions/README.md", buildEdgeFunctionsReadme(fnList));

        // --- 5. Config ---
        progress(85, "Coletando configurações...");
        zip.file("config/buckets.json", JSON.stringify(storageManifest.buckets, null, 2));
        zip.file("config/secrets-required.txt", REQUIRED_SECRETS.join("\n"));
        zip.file("config/auth-settings.md", AUTH_SETTINGS_NOTES);

        // --- 6. Prompts ---
        progress(90, "Gerando prompts de reconstrução...");
        zip.file("PROMPT_RECONSTRUCAO_COMPLETA.md", PROMPT_RECONSTRUCAO);
        zip.file("PROMPT_RESTAURAR_NO_SUPABASE.md", PROMPT_RESTAURAR);
        zip.file("README.md", README);
        zip.file("frontend/MANIFEST.md", FRONTEND_MANIFEST);

        // --- 7. Zip + upload ---
        progress(94, "Compactando arquivo...");
        const blob = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
        const filename = `system-export-${stamp}.zip`;

        progress(97, "Subindo para storage...");
        const path = `${userData.user.id}/${filename}`;
        const { error: upErr } = await admin.storage.from("system-exports").upload(path, blob, {
          contentType: "application/zip",
          upsert: true,
        });
        if (upErr) throw new Error(`Upload falhou: ${upErr.message}`);

        const { data: signed, error: signErr } = await admin.storage
          .from("system-exports")
          .createSignedUrl(path, 60 * 60);
        if (signErr) throw new Error(`Signed URL falhou: ${signErr.message}`);

        // Log activity
        await admin.from("activity_logs").insert({
          user_id: userData.user.id,
          user_email: userData.user.email!,
          action_type: "system_full_export",
          action_label: "Exportação completa do sistema",
          entity_type: "system_export",
          metadata: { filename, size_bytes: blob.length, tables: tableCount, rows: rowCount },
        });

        progress(100, "Concluído!");
        send({ type: "done", url: signed.signedUrl, filename, size_bytes: blob.length });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        send({ type: "error", message: msg });
        log(msg, "error");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// ============ Helpers ============

const REQUIRED_SECRETS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_DB_URL",
  "LOVABLE_API_KEY",
  "GOOGLE_GEMINI_API_KEY",
  "RD_STATION_API_KEY",
  "HR_HUB_WEBHOOK_SECRET",
];

import { Client as PgClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

async function withPg<T>(fn: (c: PgClient) => Promise<T>): Promise<T> {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) throw new Error("SUPABASE_DB_URL não configurado");
  const client = new PgClient(dbUrl);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function buildSchemaSQL(_admin: ReturnType<typeof createClient>, log: (m: string, l?: "info" | "success" | "error") => void): Promise<string> {
  return await withPg(async (c) => {
    const parts: string[] = [
      "-- ============================================================",
      "-- SCHEMA EXPORT — generated automatically",
      `-- Generated at: ${new Date().toISOString()}`,
      "-- Apply with: psql $DATABASE_URL -f schema.sql",
      "-- ============================================================",
      "",
      "SET statement_timeout = 0;",
      "SET client_min_messages = warning;",
      "",
    ];

    // Enums
    log("Coletando enums...");
    const enums = await c.queryObject<{ name: string; values: string[] }>(`
      SELECT t.typname AS name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
    `);
    parts.push("-- ===== ENUMS =====");
    for (const e of enums.rows) {
      parts.push(`DO $$ BEGIN CREATE TYPE public.${e.name} AS ENUM (${e.values.map((v: string) => `'${v.replace(/'/g, "''")}'`).join(", ")}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    }
    parts.push("");

    // Tables
    log("Coletando definições de tabelas...");
    const tables = await c.queryObject<{ tablename: string }>(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    parts.push("-- ===== TABLES =====");
    for (const t of tables.rows) {
      const ddl = await tableDDL(c, t.tablename);
      parts.push(ddl);
      parts.push("");
    }

    // Indexes
    log("Coletando índices...");
    const idx = await c.queryObject<{ indexdef: string }>(`
      SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT IN (
          SELECT conname FROM pg_constraint WHERE contype IN ('p','u')
        )
    `);
    parts.push("-- ===== INDEXES =====");
    for (const i of idx.rows) parts.push(i.indexdef + ";");
    parts.push("");

    // Functions
    log("Coletando functions...");
    const fns = await c.queryObject<{ def: string }>(`
      SELECT pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
    `);
    parts.push("-- ===== FUNCTIONS =====");
    for (const f of fns.rows) parts.push(f.def + ";\n");

    // Triggers
    log("Coletando triggers...");
    const trgs = await c.queryObject<{ def: string }>(`
      SELECT pg_get_triggerdef(t.oid) AS def
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND NOT t.tgisinternal
    `);
    parts.push("-- ===== TRIGGERS =====");
    for (const t of trgs.rows) parts.push(t.def + ";");
    parts.push("");

    // Views
    log("Coletando views...");
    const views = await c.queryObject<{ viewname: string; definition: string }>(`
      SELECT viewname, definition FROM pg_views WHERE schemaname = 'public'
    `);
    parts.push("-- ===== VIEWS =====");
    for (const v of views.rows) parts.push(`CREATE OR REPLACE VIEW public.${v.viewname} AS\n${v.definition}`);
    parts.push("");

    // RLS Policies
    log("Coletando policies RLS...");
    const pols = await c.queryObject<{
      schemaname: string; tablename: string; policyname: string; permissive: string;
      roles: string[]; cmd: string; qual: string | null; with_check: string | null;
    }>(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies WHERE schemaname = 'public'
    `);
    parts.push("-- ===== RLS =====");
    const rlsTables = new Set(pols.rows.map((p) => p.tablename));
    for (const tn of rlsTables) parts.push(`ALTER TABLE public.${tn} ENABLE ROW LEVEL SECURITY;`);
    parts.push("");
    for (const p of pols.rows) {
      const roles = Array.isArray(p.roles) ? p.roles.join(", ") : String(p.roles);
      const using = p.qual ? ` USING (${p.qual})` : "";
      const wc = p.with_check ? ` WITH CHECK (${p.with_check})` : "";
      parts.push(`CREATE POLICY "${p.policyname}" ON public.${p.tablename} AS ${p.permissive} FOR ${p.cmd} TO ${roles}${using}${wc};`);
    }

    return parts.join("\n");
  });
}

async function tableDDL(c: PgClient, tablename: string): Promise<string> {
  const cols = await c.queryObject<{
    column_name: string; data_type: string; is_nullable: string;
    column_default: string | null; udt_name: string;
  }>(
    `SELECT column_name, data_type, is_nullable, column_default, udt_name
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1
     ORDER BY ordinal_position`,
    [tablename],
  );

  const colDefs = cols.rows.map((c) => {
    let type = c.data_type;
    if (type === "USER-DEFINED") type = `public.${c.udt_name}`;
    else if (type === "ARRAY") type = `${c.udt_name.replace(/^_/, "")}[]`;
    const nullable = c.is_nullable === "YES" ? "" : " NOT NULL";
    const def = c.column_default ? ` DEFAULT ${c.column_default}` : "";
    return `  ${quoteIdent(c.column_name)} ${type}${def}${nullable}`;
  });

  const cons = await c.queryObject<{ conname: string; def: string }>(
    `SELECT conname, pg_get_constraintdef(c.oid) AS def
     FROM pg_constraint c
     JOIN pg_class t ON t.oid = c.conrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname='public' AND t.relname=$1`,
    [tablename],
  );

  const consDefs = cons.rows.map((k) => `  CONSTRAINT ${quoteIdent(k.conname)} ${k.def}`);

  return `CREATE TABLE IF NOT EXISTS public.${quoteIdent(tablename)} (\n${[...colDefs, ...consDefs].join(",\n")}\n);`;
}

function quoteIdent(name: string): string {
  return /^[a-z_][a-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`;
}

async function dumpTables(admin: ReturnType<typeof createClient>, log: (m: string, l?: "info" | "success" | "error") => void) {
  return await withPg(async (c) => {
    const tables = await c.queryObject<{ tablename: string }>(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename
    `);

    const tableFiles: Record<string, string> = {};
    const seedParts: string[] = [
      "-- ============================================================",
      "-- DATA SEED — generated automatically",
      "-- ============================================================",
      "",
      "SET session_replication_role = replica;",
      "",
    ];
    let totalRows = 0;

    for (const { tablename } of tables.rows) {
      const result = await c.queryObject<Record<string, unknown>>(`SELECT * FROM public.${quoteIdent(tablename)}`);
      const rows = result.rows;
      totalRows += rows.length;
      tableFiles[tablename] = JSON.stringify(rows, null, 2);

      if (rows.length === 0) continue;
      const cols = Object.keys(rows[0]);
      seedParts.push(`-- ${tablename} (${rows.length} rows)`);
      for (const row of rows) {
        const vals = cols.map((k) => sqlLiteral(row[k]));
        seedParts.push(`INSERT INTO public.${quoteIdent(tablename)} (${cols.map(quoteIdent).join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT DO NOTHING;`);
      }
      seedParts.push("");
      log(`  ${tablename}: ${rows.length} linhas`);
    }

    seedParts.push("SET session_replication_role = DEFAULT;");

    return {
      seedSQL: seedParts.join("\n"),
      tableFiles,
      tableCount: tables.rows.length,
      rowCount: totalRows,
    };
  });
}

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (Array.isArray(v) || typeof v === "object") {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function dumpStorage(admin: ReturnType<typeof createClient>, zip: JSZip, log: (m: string, l?: "info" | "success" | "error") => void) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);
  const manifest: { buckets: any[]; files: any[] } = { buckets: buckets || [], files: [] };

  for (const b of buckets || []) {
    if (b.id === "system-exports") continue;
    log(`Bucket: ${b.name}`);
    const files = await listAll(admin, b.name, "");
    for (const f of files) {
      try {
        const { data, error } = await admin.storage.from(b.name).download(f);
        if (error || !data) { log(`  skip ${f}: ${error?.message}`, "error"); continue; }
        const buf = new Uint8Array(await data.arrayBuffer());
        zip.file(`storage/files/${b.name}/${f}`, buf);
        manifest.files.push({ bucket: b.name, path: f, size: buf.length });
      } catch (e) {
        log(`  erro em ${f}: ${e instanceof Error ? e.message : String(e)}`, "error");
      }
    }
  }
  return manifest;
}

async function listAll(admin: ReturnType<typeof createClient>, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) return out;
  for (const item of data || []) {
    if (!item.name) continue;
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if ((item as any).id === null) {
      const sub = await listAll(admin, bucket, full);
      out.push(...sub);
    } else {
      out.push(full);
    }
  }
  return out;
}

async function listEdgeFunctions(_admin: ReturnType<typeof createClient>): Promise<string[]> {
  return [
    "analyze-resumes",
    "check-analysis-status",
    "exchange-hub-token",
    "extract-application-data",
    "hr-hub-webhook",
    "hub-login",
    "send-lead-to-marq",
    "send-lead-to-rdstation",
    "temp-password",
    "system-full-export",
  ];
}

function buildEdgeFunctionsReadme(fns: string[]): string {
  return `# Edge Functions\n\nO código-fonte das edge functions vive em \`supabase/functions/<nome>/index.ts\` no repositório frontend.\n\nFunctions atualmente deployadas:\n\n${fns.map((f) => `- ${f}`).join("\n")}\n\nPara redeployar em um novo ambiente, copie o diretório \`supabase/functions/\` do código-fonte e rode \`supabase functions deploy <nome>\` para cada uma, ou use o deploy automático do Lovable.\n`;
}

const AUTH_SETTINGS_NOTES = `# Configurações de Autenticação\n\nEste projeto usa Supabase Auth com:\n\n- Email/Password\n- Google OAuth (configurado via dashboard)\n- Trigger \`handle_new_user\` cria registro em \`public.profiles\` automaticamente\n- Trigger \`create_default_role\` atribui role 'lead' por padrão\n- Trigger \`create_default_pipeline_stages\` cria estágios padrão para novo profile\n\nValidações via function \`is_corporate_email\` no \`handle_new_user\` (exceto usuários vindos de hr_hub).\n\n## Para restaurar:\n\n1. Configure providers no painel Supabase (Auth → Providers)\n2. Defina Site URL e Redirect URLs\n3. Os triggers de auth.users → profiles já vêm no schema.sql\n4. Configure templates de e-mail conforme necessário\n`;

const FRONTEND_MANIFEST = `# Frontend\n\nStack: React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui\n\nDependências: ver package.json no repositório.\n\nVariáveis de ambiente necessárias (.env):\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_PUBLISHABLE_KEY\n- VITE_SUPABASE_PROJECT_ID\n\nO código-fonte completo vive no repositório Lovable/Git. Esta exportação contém o backend; combine com o snapshot do repositório para reconstrução total.\n`;

const README = `# Exportação Completa do Sistema\n\nGerado em: ${new Date().toISOString()}\n\n## Conteúdo\n\n- \`database/schema.sql\` — schema completo (tabelas, enums, índices, functions, triggers, views, RLS policies)\n- \`database/seed.sql\` — INSERTs de todos os dados\n- \`database/tables/*.json\` — dump JSON por tabela (backup paralelo)\n- \`storage/files/\` — arquivos de todos os buckets\n- \`storage/manifest.json\` — inventário\n- \`edge-functions/README.md\` — lista de functions deployadas\n- \`config/\` — buckets, secrets requeridos, notas de auth\n- \`PROMPT_RECONSTRUCAO_COMPLETA.md\` — para IA recriar do zero\n- \`PROMPT_RESTAURAR_NO_SUPABASE.md\` — para restaurar backend num Supabase novo\n\n## Limitações\n\n- Valores de secrets NÃO são exportados (apenas nomes)\n- Código-fonte de edge functions e frontend vive no repositório Git\n- Configurações de auth providers requerem reconfiguração manual no painel\n`;

const PROMPT_RECONSTRUCAO = `# Prompt: Reconstrução Completa do Sistema\n\nVocê é uma IA encarregada de recriar este sistema integralmente em um novo ambiente, idêntico ao original. Use os arquivos contidos neste pacote como fonte da verdade.\n\n## Stack alvo\n\n- React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui\n- Supabase (Postgres + Auth + Storage + Edge Functions Deno)\n\n## Passos obrigatórios\n\n1. **Provisione um novo projeto Supabase** (ou use Lovable Cloud).\n2. **Aplique o schema:** execute \`database/schema.sql\` no banco. Isso cria todas as tabelas, enums, índices, functions, triggers, views e policies RLS.\n3. **Carregue os dados:** execute \`database/seed.sql\` para popular todas as tabelas. Em caso de conflito de tipos, valide com \`database/tables/*.json\`.\n4. **Recrie buckets de storage:** para cada bucket em \`config/buckets.json\`, crie-o com o mesmo \`public/private\` setting. Faça upload do conteúdo de \`storage/files/<bucket>/\` mantendo a estrutura de pastas.\n5. **Deploy das edge functions:** copie \`supabase/functions/*\` do repositório frontend. Functions listadas em \`edge-functions/README.md\`.\n6. **Secrets:** configure todos os secrets listados em \`config/secrets-required.txt\` com valores fornecidos pelo operador.\n7. **Auth:** siga \`config/auth-settings.md\`. Configure Google OAuth e templates de e-mail.\n8. **Frontend:** clone o repositório, rode \`bun install\`, configure \`.env\` com as novas URLs do Supabase, rode \`bun dev\`.\n\n## Regras de negócio a preservar\n\n- Multi-tenant via \`user_id\` em todas as tabelas com RLS\n- Roles em \`user_roles\` (enum \`app_role\`) — nunca em \`profiles\`\n- Admins hardcoded: \`mauricio@marqponto.com.br\`, \`marco@marqponto.com.br\` (via function \`is_admin_email()\`)\n- Validação de e-mail corporativo em signups (function \`is_corporate_email\`)\n- Storage bucket \`resumes\`: estrutura \`{job_posting_id}/{uuid}.pdf\`\n- Public form via \`/apply/:slug\`\n\n## Critérios de sucesso\n\n- Login funciona com usuários existentes (senhas continuam válidas — o dump preserva \`encrypted_password\` se aplicado a auth.users via service_role)\n- Todas as RLS policies vigentes — usuários só veem seus próprios dados\n- Edge functions respondem com mesmos contratos\n- Upload e download de resumes funciona\n- Painel admin funciona apenas para emails autorizados\n\n## Atenção\n\n- NÃO altere a lógica de policies sem entender os impactos multi-tenant\n- NÃO remova triggers de auth.users\n- NÃO crie role com privilegio sem passar por \`user_roles\` + \`has_role()\`\n`;

const PROMPT_RESTAURAR = `# Prompt: Restaurar Backend em Novo Supabase\n\nVocê tem o código-fonte completo deste sistema (repositório frontend). Sua tarefa é provisionar um novo backend Supabase e restaurar todo o estado a partir deste pacote.\n\n## Pré-requisitos\n\n- Acesso a um projeto Supabase vazio (ou Lovable Cloud novo)\n- Credenciais de service_role do novo projeto\n- Este pacote .zip extraído\n\n## Passos\n\n1. **Schema:** \`psql $NEW_DB_URL -f database/schema.sql\`\n2. **Dados:** \`psql $NEW_DB_URL -f database/seed.sql\`\n3. **Storage:**\n   - Para cada bucket em \`config/buckets.json\`, crie no novo projeto com o mesmo \`public\` flag.\n   - Faça upload de \`storage/files/<bucket>/**\` mantendo paths exatos (use \`supabase storage cp\` ou um script com supabase-js).\n4. **Edge Functions:** \`supabase functions deploy <nome>\` para cada function em \`supabase/functions/\` do código.\n5. **Secrets:** \`supabase secrets set NOME=valor\` para cada nome em \`config/secrets-required.txt\`.\n6. **Auth providers:** configure Google OAuth no painel; ajuste Site URL e Redirect URLs.\n7. **.env do frontend:** atualize \`VITE_SUPABASE_URL\`, \`VITE_SUPABASE_PUBLISHABLE_KEY\`, \`VITE_SUPABASE_PROJECT_ID\`.\n\n## Validação\n\n- [ ] Login funciona\n- [ ] Usuário consegue criar vaga\n- [ ] Candidato consegue se aplicar via /apply/:slug\n- [ ] Upload de resume vai pro bucket correto\n- [ ] Painel admin acessível apenas para emails autorizados\n- [ ] RLS bloqueia acesso cruzado entre tenants\n\n## Em caso de erro\n\n- \`session_replication_role = replica\` no seed.sql desabilita FKs durante o load — se algum INSERT falhar, verifique ordem de tabelas em \`database/tables/\`.\n- Triggers em \`auth.users\` precisam estar criados ANTES de inserir users (já tratado no schema.sql).\n`;
