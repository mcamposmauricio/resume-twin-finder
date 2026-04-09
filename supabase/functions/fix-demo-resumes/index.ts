import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get all resume_urls for marco@'s applications
  const { data: apps, error } = await supabase
    .from("job_applications")
    .select("id, resume_url, job_posting_id")
    .not("resume_url", "is", null)
    .in("job_posting_id", (
      await supabase
        .from("job_postings")
        .select("id")
        .eq("user_id", (
          await supabase.from("profiles").select("user_id").eq("email", "marco@marqponto.com.br").single()
        ).data!.user_id)
    ).data!.map((j: any) => j.id));

  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: corsHeaders });

  // Fetch the PDF from request body
  const pdfBytes = await req.arrayBuffer();
  
  let uploaded = 0;
  const errors: string[] = [];

  for (const app of apps || []) {
    const path = app.resume_url;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadError) {
      errors.push(`${path}: ${uploadError.message}`);
    } else {
      uploaded++;
    }
  }

  return new Response(
    JSON.stringify({ uploaded, total: apps?.length, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
