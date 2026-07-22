// Enriched leads CSV export (one row per profile), joining every table with lead info.
// Restricted to mauricio@marqponto.com.br.

import { createClient } from "npm:@supabase/supabase-js@2";
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
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

const ADMIN_EMAILS = new Set([
  "mauricio@marqponto.com.br",
  "marco@marqponto.com.br",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResp({ error: "Unauthorized" }, 401);
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return jsonResp({ error: "Unauthorized" }, 401);
  if (userData.user.email !== ALLOWED_EMAIL) return jsonResp({ error: "Forbidden" }, 403);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const log = (message: string, level: "info" | "success" | "error" = "info") =>
        send({ type: "log", message, level });
      const progress = (percent: number, message: string) =>
        send({ type: "progress", percent, message });

      const pg = new PgClient(DB_URL);
      try {
        await pg.connect();
        progress(5, "Conectado ao banco...");
        log("Iniciando agregação de leads...", "info");

        progress(15, "Executando consulta consolidada...");
        const result = await pg.queryObject<Record<string, unknown>>(LEADS_SQL);
        const rows = result.rows;
        log(`${rows.length} leads consolidados.`, "success");
        progress(65, "Gerando CSV...");

        const columns = COLUMNS;
        const adminSet = ADMIN_EMAILS;
        const enriched = rows.map((r) => ({
          ...r,
          is_admin_email: adminSet.has(String(r.email ?? "").toLowerCase()),
        }));

        const csv = toCSV(enriched, columns);
        progress(80, "Enviando CSV para o storage...");

        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
        const path = `leads/leads-${stamp}.csv`;
        const bytes = new TextEncoder().encode("\uFEFF" + csv);
        const { error: upErr } = await admin.storage
          .from("system-exports")
          .upload(path, bytes, { contentType: "text/csv; charset=utf-8", upsert: true });
        if (upErr) throw upErr;

        const { data: signed, error: signErr } = await admin.storage
          .from("system-exports")
          .createSignedUrl(path, 60 * 60 * 24);
        if (signErr || !signed) throw signErr ?? new Error("Falha ao assinar URL");

        try {
          await admin.from("activity_logs").insert({
            user_id: userData.user.id,
            user_email: userData.user.email,
            action_type: "leads_export",
            action_label: "Exportação de leads",
            metadata: { rows: rows.length, path, columns: columns.length },
          });
        } catch { /* non-fatal */ }

        progress(100, "Concluído.");
        send({
          type: "done",
          filename: `leads-${stamp}.csv`,
          url: signed.signedUrl,
          rows: rows.length,
          columns: columns.length,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        send({ type: "error", message: msg });
      } finally {
        try { await pg.end(); } catch { /* ignore */ }
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

function jsonResp(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

function toCSV(rows: Record<string, unknown>[], cols: string[]): string {
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")).join("\n");
  return header + "\n" + body + "\n";
}

const COLUMNS = [
  // Identity
  "user_id", "email", "name", "phone", "cargo", "company_name", "employee_count",
  "source", "hr_hub_user_id", "lead_source", "referral_code", "referred_by_code",
  "is_blocked", "show_marq_banner", "total_resumes",
  "created_at", "updated_at",
  "auth_last_sign_in_at", "auth_email_confirmed_at", "auth_provider",
  // Role
  "role", "is_full_access", "is_admin_email",
  // Careers / brand
  "careers_page_enabled", "careers_page_slug",
  "company_website", "company_linkedin", "company_instagram",
  "company_whatsapp", "company_youtube", "company_tiktok", "company_glassdoor",
  "has_logo", "brand_color",
  "has_about", "has_mission", "has_vision", "has_values", "has_culture",
  "benefits_count",
  // Analyses
  "analyses_total", "analyses_completed", "analyses_last_at",
  "tokens_used_total", "resumes_analyzed_total",
  // Jobs
  "jobs_total", "jobs_draft", "jobs_active", "jobs_paused", "jobs_closed",
  "jobs_first_created_at", "jobs_last_created_at", "careers_public_jobs",
  // Applications received
  "applications_total", "applications_last_at",
  "applications_new", "applications_low_fit", "applications_deserves_analysis",
  "applications_with_resume", "applications_favorited", "unique_candidates",
  // Templates & pipeline
  "form_templates_count", "job_templates_count", "pipeline_stages_count",
  // Activity & invites
  "activity_logs_count", "activity_logs_last_at", "invites_sent",
  // Derived
  "days_since_signup", "days_since_last_activity", "engagement_score",
];

const LEADS_SQL = `
WITH
au AS (
  SELECT id,
    last_sign_in_at,
    email_confirmed_at,
    COALESCE(raw_app_meta_data->>'provider', 'email') AS provider
  FROM auth.users
),
role_agg AS (
  SELECT user_id,
    string_agg(role::text, ',' ORDER BY role::text) AS role,
    bool_or(role = 'full_access') AS is_full_access
  FROM public.user_roles GROUP BY user_id
),
an AS (
  SELECT user_id,
    COUNT(*) AS analyses_total,
    COUNT(*) FILTER (WHERE status = 'completed') AS analyses_completed,
    MAX(created_at) AS analyses_last_at,
    COALESCE(SUM(tokens_used), 0) AS tokens_used_total,
    COALESCE(SUM(
      CASE WHEN jsonb_typeof(candidates) = 'array'
           THEN jsonb_array_length(candidates) ELSE 0 END
    ), 0) AS resumes_analyzed_total
  FROM public.analyses GROUP BY user_id
),
jp AS (
  SELECT user_id,
    COUNT(*) AS jobs_total,
    COUNT(*) FILTER (WHERE status = 'draft')  AS jobs_draft,
    COUNT(*) FILTER (WHERE status = 'active') AS jobs_active,
    COUNT(*) FILTER (WHERE status = 'paused') AS jobs_paused,
    COUNT(*) FILTER (WHERE status = 'closed') AS jobs_closed,
    MIN(created_at) AS jobs_first_created_at,
    MAX(created_at) AS jobs_last_created_at,
    COUNT(*) FILTER (WHERE status = 'active' AND public_slug IS NOT NULL) AS careers_public_jobs
  FROM public.job_postings GROUP BY user_id
),
ja AS (
  SELECT jp.user_id,
    COUNT(a.*) AS applications_total,
    MAX(a.created_at) AS applications_last_at,
    COUNT(*) FILTER (WHERE a.triage_status = 'new') AS applications_new,
    COUNT(*) FILTER (WHERE a.triage_status = 'low_fit') AS applications_low_fit,
    COUNT(*) FILTER (WHERE a.triage_status = 'deserves_analysis') AS applications_deserves_analysis,
    COUNT(*) FILTER (WHERE a.resume_url IS NOT NULL AND a.resume_url <> '') AS applications_with_resume,
    COUNT(*) FILTER (WHERE a.is_favorite = true) AS applications_favorited,
    COUNT(DISTINCT lower(a.applicant_email)) FILTER (WHERE a.applicant_email IS NOT NULL AND a.applicant_email <> '') AS unique_candidates
  FROM public.job_postings jp
  LEFT JOIN public.job_applications a ON a.job_posting_id = jp.id
  GROUP BY jp.user_id
),
ft AS (SELECT user_id, COUNT(*) AS c FROM public.form_templates GROUP BY user_id),
jt AS (SELECT user_id, COUNT(*) AS c FROM public.job_templates GROUP BY user_id),
ps AS (SELECT user_id, COUNT(*) AS c FROM public.pipeline_stages GROUP BY user_id),
al AS (
  SELECT user_id, COUNT(*) AS c, MAX(created_at) AS last_at
  FROM public.activity_logs GROUP BY user_id
),
inv AS (
  SELECT invited_by AS user_id, COUNT(*) AS c FROM public.invites GROUP BY invited_by
)
SELECT
  p.user_id,
  p.email,
  p.name,
  p.phone,
  p.cargo,
  p.company_name,
  p.employee_count,
  p.source,
  p.hr_hub_user_id,
  p.lead_source,
  p.referral_code,
  p.referred_by_code,
  p.is_blocked,
  p.show_marq_banner,
  p.total_resumes,
  p.created_at,
  p.updated_at,
  au.last_sign_in_at    AS auth_last_sign_in_at,
  au.email_confirmed_at AS auth_email_confirmed_at,
  au.provider           AS auth_provider,
  COALESCE(role_agg.role, '')     AS role,
  COALESCE(role_agg.is_full_access, false) AS is_full_access,
  COALESCE(p.careers_page_enabled, false) AS careers_page_enabled,
  p.careers_page_slug,
  p.company_website, p.company_linkedin, p.company_instagram,
  p.company_whatsapp, p.company_youtube, p.company_tiktok, p.company_glassdoor,
  (p.company_logo_url IS NOT NULL AND p.company_logo_url <> '') AS has_logo,
  p.brand_color,
  (p.company_about   IS NOT NULL AND p.company_about   <> '') AS has_about,
  (p.company_mission IS NOT NULL AND p.company_mission <> '') AS has_mission,
  (p.company_vision  IS NOT NULL AND p.company_vision  <> '') AS has_vision,
  (p.company_values  IS NOT NULL AND p.company_values  <> '') AS has_values,
  (p.company_culture IS NOT NULL AND p.company_culture <> '') AS has_culture,
  CASE WHEN jsonb_typeof(p.company_benefits) = 'array'
       THEN jsonb_array_length(p.company_benefits) ELSE 0 END AS benefits_count,
  COALESCE(an.analyses_total, 0)          AS analyses_total,
  COALESCE(an.analyses_completed, 0)      AS analyses_completed,
  an.analyses_last_at,
  COALESCE(an.tokens_used_total, 0)       AS tokens_used_total,
  COALESCE(an.resumes_analyzed_total, 0)  AS resumes_analyzed_total,
  COALESCE(jp.jobs_total, 0)   AS jobs_total,
  COALESCE(jp.jobs_draft, 0)   AS jobs_draft,
  COALESCE(jp.jobs_active, 0)  AS jobs_active,
  COALESCE(jp.jobs_paused, 0)  AS jobs_paused,
  COALESCE(jp.jobs_closed, 0)  AS jobs_closed,
  jp.jobs_first_created_at,
  jp.jobs_last_created_at,
  COALESCE(jp.careers_public_jobs, 0) AS careers_public_jobs,
  COALESCE(ja.applications_total, 0) AS applications_total,
  ja.applications_last_at,
  COALESCE(ja.applications_new, 0) AS applications_new,
  COALESCE(ja.applications_low_fit, 0) AS applications_low_fit,
  COALESCE(ja.applications_deserves_analysis, 0) AS applications_deserves_analysis,
  COALESCE(ja.applications_with_resume, 0) AS applications_with_resume,
  COALESCE(ja.applications_favorited, 0) AS applications_favorited,
  COALESCE(ja.unique_candidates, 0) AS unique_candidates,
  COALESCE(ft.c, 0) AS form_templates_count,
  COALESCE(jt.c, 0) AS job_templates_count,
  COALESCE(ps.c, 0) AS pipeline_stages_count,
  COALESCE(al.c, 0) AS activity_logs_count,
  al.last_at        AS activity_logs_last_at,
  COALESCE(inv.c, 0) AS invites_sent,
  EXTRACT(day FROM (now() - p.created_at))::int AS days_since_signup,
  EXTRACT(day FROM (now() - GREATEST(
    COALESCE(au.last_sign_in_at,   'epoch'::timestamptz),
    COALESCE(an.analyses_last_at,  'epoch'::timestamptz),
    COALESCE(jp.jobs_last_created_at, 'epoch'::timestamptz),
    COALESCE(ja.applications_last_at, 'epoch'::timestamptz),
    COALESCE(al.last_at,           'epoch'::timestamptz)
  )))::int AS days_since_last_activity,
  CASE
    WHEN COALESCE(ja.applications_total,0) > 10 OR COALESCE(jp.jobs_active,0) > 3 THEN 4
    WHEN COALESCE(ja.applications_total,0) > 0 THEN 3
    WHEN COALESCE(jp.jobs_total,0) > 0 OR COALESCE(an.analyses_total,0) > 0 THEN 2
    WHEN au.last_sign_in_at IS NOT NULL THEN 1
    ELSE 0
  END AS engagement_score
FROM public.profiles p
LEFT JOIN au       ON au.id = p.user_id
LEFT JOIN role_agg ON role_agg.user_id = p.user_id
LEFT JOIN an       ON an.user_id = p.user_id
LEFT JOIN jp       ON jp.user_id = p.user_id
LEFT JOIN ja       ON ja.user_id = p.user_id
LEFT JOIN ft       ON ft.user_id = p.user_id
LEFT JOIN jt       ON jt.user_id = p.user_id
LEFT JOIN ps       ON ps.user_id = p.user_id
LEFT JOIN al       ON al.user_id = p.user_id
LEFT JOIN inv      ON inv.user_id = p.user_id
ORDER BY p.created_at DESC;
`;
