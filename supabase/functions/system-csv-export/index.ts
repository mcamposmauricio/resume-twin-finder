// CSV export of the whole system (database, auth users, storage, edge functions).
// Restricted to mauricio@marqponto.com.br.

import { createClient } from "npm:@supabase/supabase-js@2";
import JSZip from "npm:jszip@3.10.1";
import { Client as PgClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_EMAIL = "mauricio@marqponto.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const EDGE_FUNCTIONS = [
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
  "system-csv-export",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // --- AuthZ ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return jsonResp({ error: "Unauthorized" }, 401);
  if (userData.user.email !== ALLOWED_EMAIL) return jsonResp({ error: "Forbidden" }, 403);

  let body: { action?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  if (body.action === "schema") {
    try {
      const schema = await buildSchemaSQL();
      return jsonResp({ schema });
    } catch (e) {
      return jsonResp({ error: e instanceof Error ? e.message : String(e) }, 500);
    }
  }

  // Default: export CSV ZIP via SSE
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const log = (message: string, level: "info" | "success" | "error" = "info") =>
        send({ type: "log", message, level });
      const progress = (percent: number, message: string) => send({ type: "progress", percent, message });

      try {
        const zip = new JSZip();
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);

        progress(5, "Coletando schema SQL...");
        const schema = await buildSchemaSQL();
        zip.file("schema.sql", schema);

        progress(15, "Exportando tabelas para CSV...");
        const { totalRows, tableCount } = await dumpTablesCsv(zip, log);
        log(`${tableCount} tabelas, ${totalRows} linhas exportadas`, "success");

        progress(70, "Exportando usuários do Auth...");
        await dumpAuthUsersCsv(admin, zip, log);

        progress(80, "Listando arquivos do Storage...");
        await dumpStorageManifestCsv(admin, zip, log);

        progress(88, "Listando edge functions...");
        zip.file("edge-functions.csv", buildEdgeFunctionsCsv());

        progress(92, "Compactando arquivo...");
        const blob = await zip.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });
        const filename = `csv-export-${stamp}.zip`;
        const path = `${userData.user.id}/${filename}`;

        progress(96, "Subindo arquivo...");
        const { error: upErr } = await admin.storage.from("system-exports").upload(path, blob, {
          contentType: "application/zip",
          upsert: true,
        });
        if (upErr) throw new Error(`Upload falhou: ${upErr.message}`);

        const { data: signed, error: signErr } = await admin.storage
          .from("system-exports")
          .createSignedUrl(path, 60 * 60);
        if (signErr) throw new Error(`Signed URL falhou: ${signErr.message}`);

        await admin.from("activity_logs").insert({
          user_id: userData.user.id,
          user_email: userData.user.email!,
          action_type: "system_csv_export",
          action_label: "Exportação CSV do sistema",
          entity_type: "system_export",
          metadata: { filename, size_bytes: blob.length, tables: tableCount, rows: totalRows },
        });

        progress(100, "Concluído!");
        send({ type: "done", url: signed.signedUrl, filename, size_bytes: blob.length });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        send({ type: "error", message: msg });
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

function jsonResp(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function withPg<T>(fn: (c: PgClient) => Promise<T>): Promise<T> {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) throw new Error("SUPABASE_DB_URL não configurado");
  const client = new PgClient(dbUrl);
  await client.connect();
  try { return await fn(client); } finally { await client.end(); }
}

function quoteIdent(name: string): string {
  return /^[a-z_][a-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`;
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (v instanceof Date) s = v.toISOString();
  else if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0 && !columns) return "";
  const cols = columns ?? Object.keys(rows[0] ?? {});
  const lines = [cols.map(csvCell).join(",")];
  for (const r of rows) lines.push(cols.map((c) => csvCell(r[c])).join(","));
  return lines.join("\n");
}

async function buildSchemaSQL(): Promise<string> {
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
      parts.push(
        `DO $$ BEGIN CREATE TYPE public.${e.name} AS ENUM (${e.values.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ")}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      );
    }
    parts.push("");

    const tables = await c.queryObject<{ tablename: string }>(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    parts.push("-- ===== TABLES =====");
    for (const t of tables.rows) {
      parts.push(await tableDDL(c, t.tablename));
      parts.push("");
    }

    const idx = await c.queryObject<{ indexdef: string }>(`
      SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT IN (SELECT conname FROM pg_constraint WHERE contype IN ('p','u'))
    `);
    parts.push("-- ===== INDEXES =====");
    for (const i of idx.rows) parts.push(i.indexdef + ";");
    parts.push("");

    const fns = await c.queryObject<{ def: string }>(`
      SELECT pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prokind = 'f'
    `);
    parts.push("-- ===== FUNCTIONS =====");
    for (const f of fns.rows) parts.push(f.def + ";\n");

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

    const pols = await c.queryObject<{
      tablename: string; policyname: string; permissive: string;
      roles: string[]; cmd: string; qual: string | null; with_check: string | null;
    }>(`
      SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
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
    `SELECT conname, pg_get_constraintdef(co.oid) AS def
     FROM pg_constraint co
     JOIN pg_class t ON t.oid = co.conrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname='public' AND t.relname=$1`,
    [tablename],
  );
  const consDefs = cons.rows.map((k) => `  CONSTRAINT ${quoteIdent(k.conname)} ${k.def}`);

  return `CREATE TABLE IF NOT EXISTS public.${quoteIdent(tablename)} (\n${[...colDefs, ...consDefs].join(",\n")}\n);`;
}

async function dumpTablesCsv(
  zip: JSZip,
  log: (m: string, l?: "info" | "success" | "error") => void,
): Promise<{ totalRows: number; tableCount: number }> {
  return await withPg(async (c) => {
    const tables = await c.queryObject<{ tablename: string }>(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename
    `);
    let totalRows = 0;
    for (const { tablename } of tables.rows) {
      const result = await c.queryObject<Record<string, unknown>>(
        `SELECT * FROM public.${quoteIdent(tablename)}`,
      );
      const cols = await c.queryObject<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
        [tablename],
      );
      const colNames = cols.rows.map((r) => r.column_name);
      zip.file(`database/${tablename}.csv`, rowsToCsv(result.rows, colNames));
      totalRows += result.rows.length;
      log(`  ${tablename}: ${result.rows.length} linhas`);
    }
    return { totalRows, tableCount: tables.rows.length };
  });
}

async function dumpAuthUsersCsv(
  admin: ReturnType<typeof createClient>,
  zip: JSZip,
  log: (m: string, l?: "info" | "success" | "error") => void,
) {
  const all: Record<string, unknown>[] = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) {
      all.push({
        id: u.id,
        email: u.email ?? "",
        phone: u.phone ?? "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? "",
        email_confirmed_at: u.email_confirmed_at ?? "",
        provider: u.app_metadata?.provider ?? "",
        providers: (u.app_metadata?.providers ?? []).join("|"),
        user_metadata: JSON.stringify(u.user_metadata ?? {}),
        is_anonymous: (u as any).is_anonymous ?? false,
        banned_until: (u as any).banned_until ?? "",
      });
    }
    if (data.users.length < perPage) break;
    page++;
  }
  zip.file(
    "auth/users.csv",
    rowsToCsv(all, [
      "id", "email", "phone", "created_at", "last_sign_in_at",
      "email_confirmed_at", "provider", "providers", "user_metadata",
      "is_anonymous", "banned_until",
    ]),
  );
  log(`  auth.users: ${all.length} usuários`);
}

async function dumpStorageManifestCsv(
  admin: ReturnType<typeof createClient>,
  zip: JSZip,
  log: (m: string, l?: "info" | "success" | "error") => void,
) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);

  zip.file(
    "storage/buckets.csv",
    rowsToCsv(
      (buckets ?? []).map((b) => ({
        id: b.id, name: b.name, public: b.public, created_at: b.created_at, updated_at: b.updated_at,
      })),
      ["id", "name", "public", "created_at", "updated_at"],
    ),
  );

  const allFiles: Record<string, unknown>[] = [];
  for (const b of buckets ?? []) {
    const files = await listAll(admin, b.name, "");
    for (const f of files) allFiles.push({ bucket: b.name, path: f.path, size: f.size, updated_at: f.updated_at });
    log(`  bucket ${b.name}: ${files.length} arquivos`);
  }
  zip.file("storage/files.csv", rowsToCsv(allFiles, ["bucket", "path", "size", "updated_at"]));
}

async function listAll(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
): Promise<{ path: string; size: number | null; updated_at: string | null }[]> {
  const out: { path: string; size: number | null; updated_at: string | null }[] = [];
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) return out;
  for (const item of data ?? []) {
    if (!item.name) continue;
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if ((item as any).id === null) {
      out.push(...(await listAll(admin, bucket, full)));
    } else {
      out.push({
        path: full,
        size: (item as any).metadata?.size ?? null,
        updated_at: item.updated_at ?? null,
      });
    }
  }
  return out;
}

function buildEdgeFunctionsCsv(): string {
  return rowsToCsv(EDGE_FUNCTIONS.map((name) => ({ name })), ["name"]);
}
