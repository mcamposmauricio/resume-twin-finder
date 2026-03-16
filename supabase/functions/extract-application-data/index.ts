import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACT_PROMPT = `Analise este currículo em PDF e extraia as seguintes informações do candidato:
- Nome completo
- Email
- Telefone

Retorne APENAS um JSON válido no formato:
{"name": "...", "email": "...", "phone": "..."}

Se algum campo não for encontrado, use null.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dry_run = true } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find applications with missing data but with resume
    const { data: applications, error } = await supabase
      .from("job_applications")
      .select("id, resume_url, resume_filename, job_posting_id, applicant_name, applicant_email, form_data")
      .is("applicant_name", null)
      .not("resume_url", "is", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

    console.log(`Found ${applications?.length || 0} applications to process`);

    if (!applications || applications.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma candidatura para processar.", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    for (const app of applications) {
      try {
        console.log(`Processing application ${app.id} - ${app.resume_filename}`);
        
        let pdfBase64: string;
        const resumeUrl = app.resume_url as string;
        const filename = (app.resume_filename as string || "").toLowerCase();

        // Skip non-PDF files
        if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
          throw new Error("DOCX not supported by Gemini PDF parser, skipping");
        }

        // Helper to encode ArrayBuffer to base64 without stack overflow
        const toBase64 = (buf: ArrayBuffer): string => {
          const bytes = new Uint8Array(buf);
          let binary = "";
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          return btoa(binary);
        };

        if (resumeUrl.startsWith("http://") || resumeUrl.startsWith("https://")) {
          const resp = await fetch(resumeUrl);
          if (!resp.ok) throw new Error(`Failed to download: ${resp.status}`);
          pdfBase64 = toBase64(await resp.arrayBuffer());
        } else {
          const { data: fileData, error: dlError } = await supabase.storage
            .from("resumes")
            .download(resumeUrl);
          if (dlError || !fileData) throw new Error(`Storage download failed: ${dlError?.message}`);
          pdfBase64 = toBase64(await fileData.arrayBuffer());
        }

        // Call Gemini to extract data
        const geminiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [
                  { text: EXTRACT_PROMPT },
                  { inline_data: { mime_type: "application/pdf", data: pdfBase64 } }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 256,
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (!geminiResp.ok) {
          const errText = await geminiResp.text();
          throw new Error(`Gemini error ${geminiResp.status}: ${errText.substring(0, 200)}`);
        }

        const geminiData = await geminiResp.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error("Empty Gemini response");

        let parsed: { name?: string; email?: string; phone?: string };
        try {
          let jsonStr = responseText.trim();
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
          }
          parsed = JSON.parse(jsonStr);
        } catch {
          throw new Error(`Failed to parse: ${responseText.substring(0, 100)}`);
        }

        const extractedData = {
          name: parsed.name || null,
          email: parsed.email || null,
          phone: parsed.phone || null,
        };

        const result: any = { id: app.id, filename: app.resume_filename, extracted: extractedData, status: "ok" };

        if (!dry_run && (extractedData.name || extractedData.email)) {
          const formData = typeof app.form_data === 'object' && app.form_data ? { ...app.form_data as Record<string, any> } : {};
          if (extractedData.name) formData["fallback_name"] = extractedData.name;
          if (extractedData.email) formData["fallback_email"] = extractedData.email;
          if (extractedData.phone) formData["fallback_phone"] = extractedData.phone;

          const { error: updateError } = await supabase
            .from("job_applications")
            .update({
              applicant_name: extractedData.name,
              applicant_email: extractedData.email,
              form_data: formData,
            })
            .eq("id", app.id);

          if (updateError) throw new Error(`Update failed: ${updateError.message}`);
          result.saved = true;
        } else {
          result.saved = false;
        }

        results.push(result);
        console.log(`✓ ${app.id}: ${extractedData.name} / ${extractedData.email}`);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));

      } catch (appError: any) {
        console.error(`✗ ${app.id}: ${appError.message}`);
        results.push({ id: app.id, filename: app.resume_filename, status: "error", error: appError.message });
      }
    }

    const summary = {
      dry_run,
      total: applications.length,
      ok: results.filter(r => r.status === "ok").length,
      errors: results.filter(r => r.status === "error").length,
      saved: results.filter(r => r.saved).length,
      results,
    };

    console.log(`Done. OK: ${summary.ok}, Errors: ${summary.errors}, Saved: ${summary.saved}`);

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
