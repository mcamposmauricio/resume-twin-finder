// Migration index for Let's Make → destination Lovable project.
// Serves signed URLs (7d) for SQL + manifest + all CV PDFs.
// Auth: header `x-migration-token` must match LETSMAKE_MIGRATION_TOKEN.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-migration-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const OWNER_USER_ID = "df2a4abf-6754-447b-a179-e02d4d16b502";
const TARGET_EMAIL = "anne.caroline.osorio@gmail.com";
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days (Storage max)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIGRATION_TOKEN = Deno.env.get("LETSMAKE_MIGRATION_TOKEN")!;

const PAGE = 1000;

async function fetchAllApplications(jobIds: string[], cols: string) {
  const out: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from("job_applications")
      .select(cols)
      .in("job_posting_id", jobIds)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (v instanceof Date) return `'${v.toISOString()}'::timestamptz`;
  if (typeof v === "object") {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

function buildInsert(
  table: string,
  rows: Record<string, unknown>[],
  cols: string[],
  conflict: "id" | "(user_id, slug)" = "id",
): string {
  if (rows.length === 0) return `-- no rows for ${table}\n`;
  const colList = cols.join(", ");
  const values = rows
    .map(
      (r) => `  (${cols.map((c) => sqlLiteral(r[c])).join(", ")})`,
    )
    .join(",\n");
  return `INSERT INTO public.${table} (${colList}) VALUES\n${values}\nON CONFLICT ${conflict} DO NOTHING;\n\n`;
}

async function generateSql(jobIds: string[]): Promise<string> {
  // 1. Templates used by these jobs
  const { data: jobsRows } = await admin
    .from("job_postings")
    .select("form_template_id")
    .in("id", jobIds);
  const templateIds = [
    ...new Set((jobsRows ?? []).map((j) => j.form_template_id).filter(Boolean)),
  ] as string[];

  const [{ data: templates }, { data: stages }, { data: jobs }, apps] =
    await Promise.all([
      templateIds.length
        ? admin
            .from("form_templates")
            .select("id, name, description, fields, is_default, created_at, updated_at")
            .in("id", templateIds)
        : Promise.resolve({ data: [] as any[] }),
      admin
        .from("pipeline_stages")
        .select("id, name, slug, color, icon, order, is_default, created_at")
        .eq("user_id", OWNER_USER_ID),
      admin
        .from("job_postings")
        .select(
          "id, title, description, requirements, location, salary_range, work_type, form_template_id, status, public_slug, expires_at, closed_at, analyzed_at, company_name, company_logo_url, brand_color, created_at, updated_at",
        )
        .in("id", jobIds),
      fetchAllApplications(
        jobIds,
        "id, job_posting_id, form_data, resume_url, resume_filename, applicant_email, applicant_name, status, triage_status, is_favorite, created_at",
      ),
    ]);

  const header = `-- Let's Make migration import
-- Idempotent. Resolves user_id at runtime from email.
-- Target email: ${TARGET_EMAIL}
-- Jobs: ${jobs?.length ?? 0} | Applications: ${apps?.length ?? 0} | Templates: ${templates?.length ?? 0} | Stages: ${stages?.length ?? 0}

DO $migration$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = '${TARGET_EMAIL}';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found: ${TARGET_EMAIL}. Create the user first.';
  END IF;

`;

  const templatesWithUser = (templates ?? []).map((t) => ({
    ...t,
    user_id: "__USER__",
  }));
  const stagesWithUser = (stages ?? []).map((s) => ({
    ...s,
    user_id: "__USER__",
  }));
  const jobsWithUser = (jobs ?? []).map((j) => ({ ...j, user_id: "__USER__" }));

  let body = "";
  body += "  -- form_templates\n";
  body += buildInsert(
    "form_templates",
    templatesWithUser,
    [
      "id",
      "user_id",
      "name",
      "description",
      "fields",
      "is_default",
      "created_at",
      "updated_at",
    ],
  );
  body += "  -- pipeline_stages\n";
  body += buildInsert(
    "pipeline_stages",
    stagesWithUser,
    ["id", "user_id", "name", "slug", "color", "icon", "order", "is_default", "created_at"],
  );
  body += "  -- job_postings\n";
  body += buildInsert("job_postings", jobsWithUser, [
    "id",
    "user_id",
    "title",
    "description",
    "requirements",
    "location",
    "salary_range",
    "work_type",
    "form_template_id",
    "status",
    "public_slug",
    "expires_at",
    "closed_at",
    "analyzed_at",
    "company_name",
    "company_logo_url",
    "brand_color",
    "created_at",
    "updated_at",
  ]);
  body += "  -- job_applications\n";
  body += buildInsert("job_applications", apps ?? [], [
    "id",
    "job_posting_id",
    "form_data",
    "resume_url",
    "resume_filename",
    "applicant_email",
    "applicant_name",
    "status",
    "triage_status",
    "is_favorite",
    "created_at",
  ]);

  // Replace the __USER__ placeholder with the resolved v_user_id (unquoted).
  body = body.replaceAll("'__USER__'", "v_user_id");

  return header + body + "\nEND $migration$;\n";
}

async function listAllCvPaths(jobIds: string[]): Promise<
  { path: string; size: number }[]
> {
  const out: { path: string; size: number }[] = [];
  for (const jobId of jobIds) {
    let offset = 0;
    while (true) {
      const { data, error } = await admin.storage
        .from("resumes")
        .list(jobId, { limit: 1000, offset });
      if (error) throw new Error(`list ${jobId}: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const f of data) {
        if (!f.name || f.name.endsWith("/")) continue;
        out.push({
          path: `${jobId}/${f.name}`,
          size: (f.metadata as any)?.size ?? 0,
        });
      }
      if (data.length < 1000) break;
      offset += 1000;
    }
  }
  return out;
}

async function signMany(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const CHUNK = 100;
  for (let i = 0; i < paths.length; i += CHUNK) {
    const slice = paths.slice(i, i + CHUNK);
    const { data, error } = await admin.storage
      .from("resumes")
      .createSignedUrls(slice, SIGNED_TTL);
    if (error) throw new Error(`sign: ${error.message}`);
    for (const item of data ?? []) {
      if (item.signedUrl && item.path) {
        map.set(item.path, item.signedUrl);
      }
    }
  }
  return map;
}

async function uploadJson(path: string, obj: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(obj, null, 2));
  const { error } = await admin.storage
    .from("system-exports")
    .upload(path, bytes, {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  const { data, error: signErr } = await admin.storage
    .from("system-exports")
    .createSignedUrl(path, SIGNED_TTL);
  if (signErr || !data?.signedUrl) throw new Error(`sign ${path}: ${signErr?.message}`);
  return data.signedUrl;
}

async function uploadText(path: string, text: string, contentType: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const { error } = await admin.storage
    .from("system-exports")
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  const { data, error: signErr } = await admin.storage
    .from("system-exports")
    .createSignedUrl(path, SIGNED_TTL);
  if (signErr || !data?.signedUrl) throw new Error(`sign ${path}: ${signErr?.message}`);
  return data.signedUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = req.headers.get("x-migration-token");
    if (!token || token !== MIGRATION_TOKEN) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") ?? "open").toLowerCase();
    if (!["open", "all"].includes(scope)) {
      return new Response(JSON.stringify({ error: "invalid scope" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statuses = scope === "open" ? ["active", "paused"] : ["active", "paused", "draft", "closed"];

    const { data: jobsList, error: jobsErr } = await admin
      .from("job_postings")
      .select("id")
      .eq("user_id", OWNER_USER_ID)
      .in("status", statuses);
    if (jobsErr) throw jobsErr;
    const jobIds = (jobsList ?? []).map((j) => j.id as string);

    // Applications summary for external URL list.
    const appsForExt = await fetchAllApplications(jobIds, "id, resume_url");
    const externalUrls = appsForExt
      .filter((a: any) => a.resume_url && /^https?:\/\//i.test(a.resume_url))
      .map((a: any) => ({ application_id: a.id, url: a.resume_url }));

    // 1. SQL
    const sql = await generateSql(jobIds);
    const sqlUrl = await uploadText(
      `letsmake/${scope}/01_import.sql`,
      sql,
      "application/sql",
    );

    // 2. CV list from storage
    const cvPaths = await listAllCvPaths(jobIds);
    const signMap = await signMany(cvPaths.map((c) => c.path));
    const cvs = cvPaths.map((c) => {
      const [job_posting_id, ...rest] = c.path.split("/");
      return {
        job_posting_id,
        filename: rest.join("/"),
        storage_path: c.path,
        url: signMap.get(c.path) ?? null,
        size: c.size,
      };
    });

    // 3. Manifest
    const manifest = {
      scope,
      generated_at: new Date().toISOString(),
      target_email: TARGET_EMAIL,
      counts: {
        jobs: jobIds.length,
        applications: appsForExt?.length ?? 0,
        cvs_internal: cvs.length,
        cvs_external: externalUrls.length,
      },
      cvs,
      external_urls: externalUrls,
    };
    const manifestUrl = await uploadJson(
      `letsmake/${scope}/manifest.json`,
      manifest,
    );

    const body = {
      scope,
      generated_at: manifest.generated_at,
      expires_in_days: 7,
      target_email: TARGET_EMAIL,
      counts: manifest.counts,
      sql_url: sqlUrl,
      manifest_url: manifestUrl,
      cvs,
      external_urls: externalUrls,
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("letsmake-migration-index error", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message ?? err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
