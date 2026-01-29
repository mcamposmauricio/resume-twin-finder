import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 4;
const PARALLEL_BATCHES = 2;

const SYSTEM_PROMPT = `Você é um especialista sênior em RH e recrutamento. Sua tarefa é analisar currículos de candidatos em relação a uma descrição de vaga específica.

Para CADA candidato, forneça uma análise com:

1. **candidate_name**: Nome do candidato (extraído do CV)
2. **file_name**: Nome do arquivo
3. **match_score** (0-100): Compatibilidade com a vaga
4. **technical_fit** (0-100): Adequação técnica
5. **potential_fit** (0-100): Potencial de crescimento
6. **summary**: Resumo de 1-2 frases curtas
7. **years_experience**: Anos de experiência (número)
8. **soft_skills**: Array de objetos {name: string, score: number} com 4-5 skills principais
9. **cultural_fit**: {results_orientation, process_orientation, people_orientation, innovation_orientation} (0-100)
10. **red_flags**: Array de strings (máx 3)
11. **gap_analysis**: {strong_match: string[], moderate_match: string[], weak_or_missing: string[]} (máx 4 itens cada)
12. **inferred_info**: {seniority_level, estimated_salary_range, tools_and_technologies: string[], industry_experience: string[], education_level, languages: string[], certifications: string[], leadership_experience, remote_work_compatibility, availability}

REGRAS CRÍTICAS:
- Responda APENAS com JSON válido, SEM markdown, SEM \`\`\`
- Retorne um objeto com "candidates_analysis" contendo o array de candidatos
- Mantenha respostas CONCISAS para evitar truncamento
- soft_skills DEVE ser array de objetos: [{"name": "Comunicação", "score": 85}]`;

const SUMMARY_PROMPT = `Com base nas análises individuais dos candidatos abaixo, forneça:
1. **recommendation**: Uma recomendação geral curta (1-2 frases) sobre os melhores candidatos
2. **comparison_summary**: Um resumo comparativo curto (2-3 frases)

Responda APENAS com JSON válido contendo: {"recommendation": "...", "comparison_summary": "..."}`;

function getSanitizedErrorCode(error: string): string {
  if (error.includes("API key") || error.includes("unauthorized")) {
    return "CONFIG_ERROR";
  }
  if (error.includes("timeout") || error.includes("DEADLINE_EXCEEDED")) {
    return "ANALYSIS_ERROR";
  }
  return "ANALYSIS_ERROR";
}

interface AnalysisJob {
  id: string;
  files: any[];
  jobDescription: string;
  userId: string;
  jobTitle?: string;
  jobPostingId?: string;
}

async function updateJobProgress(
  supabase: any, 
  jobId: string, 
  progress: number, 
  currentStep: string
) {
  const { error } = await supabase
    .from("analysis_jobs")
    .update({ progress, current_step: currentStep })
    .eq("id", jobId);
  
  if (error) {
    console.error(`Failed to update job progress: ${error.message}`);
  }
}

async function completeJob(
  supabase: any,
  jobId: string,
  result: any,
  durationSeconds?: number
) {
  const { error } = await supabase
    .from("analysis_jobs")
    .update({
      status: "completed",
      progress: 100,
      current_step: "Análise concluída!",
      result,
      duration_seconds: durationSeconds
    })
    .eq("id", jobId);
  
  if (error) {
    console.error(`Failed to complete job: ${error.message}`);
  }
}

async function failJob(
  supabase: any,
  jobId: string,
  errorMessage: string
) {
  const { error } = await supabase
    .from("analysis_jobs")
    .update({
      status: "error",
      error_message: errorMessage,
      current_step: "Erro na análise"
    })
    .eq("id", jobId);
  
  if (error) {
    console.error(`Failed to update job error: ${error.message}`);
  }
}

async function processBatch(
  batchFiles: any[],
  jobDescription: string,
  apiKey: string,
  batchNumber: number,
  totalBatches: number
): Promise<{ candidates: any[]; tokens: number }> {
  console.log(`Processing batch ${batchNumber}/${totalBatches} with ${batchFiles.length} files...`);

  const parts: any[] = [
    { text: `DESCRIÇÃO DA VAGA:\n${jobDescription}\n\nCURRÍCULOS DOS CANDIDATOS:\n` }
  ];

  for (let i = 0; i < batchFiles.length; i++) {
    const file = batchFiles[i];
    parts.push({ text: `\n--- CANDIDATO ${i + 1} (arquivo: ${file.name}) ---\n` });

    if (file.type === "application/pdf") {
      parts.push({
        inline_data: {
          mime_type: "application/pdf",
          data: file.content
        }
      });
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      try {
        const decoded = atob(file.content);
        parts.push({ text: decoded });
      } catch {
        parts.push({ text: file.content });
      }
    }
  }

  parts.push({ text: "\n\nAgora analise todos os candidatos e retorne o JSON conforme especificado." });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "Entendido. Vou analisar os currículos e fornecer uma análise detalhada em JSON." }] },
          { role: "user", parts: parts }
        ],
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 32768,
          responseMimeType: "application/json"
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Batch ${batchNumber} - Gemini API error:`, response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error("No response from AI");
  }

  const candidates = parseCandidatesFromResponse(responseText, batchNumber, batchFiles);
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

  console.log(`Batch ${batchNumber} - Parsed ${candidates.length} candidates, ${tokensUsed} tokens`);
  return { candidates, tokens: tokensUsed };
}

function parseCandidatesFromResponse(responseText: string, batchNumber: number, batchFiles: any[]): any[] {
  try {
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    
    const parsed = JSON.parse(jsonStr);
    
    let candidates: any[];
    if (Array.isArray(parsed)) {
      candidates = parsed;
    } else if (parsed.candidates_analysis) {
      candidates = parsed.candidates_analysis;
    } else if (parsed.candidates) {
      candidates = parsed.candidates;
    } else {
      const candidatesKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]) && parsed[k].length > 0 && parsed[k][0].candidate_name);
      if (candidatesKey) {
        candidates = parsed[candidatesKey];
      } else {
        throw new Error("Could not find candidates in response");
      }
    }

    return candidates.map((c: any, idx: number) => ({
      ...c,
      file_name: c.file_name || batchFiles[idx]?.name || `Arquivo ${idx + 1}`
    }));
  } catch (parseError) {
    console.error(`Batch ${batchNumber} - JSON parse error:`, parseError);
    console.error("First 500 chars:", responseText.substring(0, 500));
    
    try {
      const arrayMatch = responseText.match(/\[\s*\{[\s\S]*"candidate_name"[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        const candidates = JSON.parse(arrayMatch[0]);
        return candidates.map((c: any, idx: number) => ({
          ...c,
          file_name: c.file_name || batchFiles[idx]?.name || `Arquivo ${idx + 1}`
        }));
      }
      throw new Error("Could not recover JSON structure");
    } catch (recoveryError) {
      console.error(`Batch ${batchNumber} - Recovery failed:`, recoveryError);
      throw new Error("Failed to parse AI response");
    }
  }
}

async function generateSummary(
  allCandidates: any[],
  jobDescription: string,
  apiKey: string
): Promise<{ recommendation: string; comparison_summary: string; tokens: number }> {
  console.log("Generating summary for all candidates...");

  const candidateSummaries = allCandidates.map(c => ({
    name: c.candidate_name,
    match_score: c.match_score,
    technical_fit: c.technical_fit,
    potential_fit: c.potential_fit,
    summary: c.summary
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ 
            text: `${SUMMARY_PROMPT}\n\nDESCRIÇÃO DA VAGA:\n${jobDescription.substring(0, 500)}...\n\nCANDIDATOS ANALISADOS:\n${JSON.stringify(candidateSummaries, null, 2)}`
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      }),
    }
  );

  if (!response.ok) {
    console.error("Summary generation failed, using defaults");
    return {
      recommendation: "Análise completa dos candidatos realizada com sucesso.",
      comparison_summary: "Veja a tabela comparativa para detalhes sobre cada candidato.",
      tokens: 0
    };
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

  try {
    let jsonStr = responseText?.trim() || "{}";
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    const parsed = JSON.parse(jsonStr);
    return {
      recommendation: parsed.recommendation || "Análise completa dos candidatos realizada com sucesso.",
      comparison_summary: parsed.comparison_summary || "Veja a tabela comparativa para detalhes.",
      tokens: tokensUsed
    };
  } catch {
    return {
      recommendation: "Análise completa dos candidatos realizada com sucesso.",
      comparison_summary: "Veja a tabela comparativa para detalhes sobre cada candidato.",
      tokens: tokensUsed
    };
  }
}

async function processAnalysisInBackground(
  supabase: any,
  job: AnalysisJob,
  apiKey: string
) {
  const { id: jobId, files, jobDescription, userId, jobTitle, jobPostingId } = job;
  const startTime = Date.now();
  
  try {
    console.log(`Starting background processing for job ${jobId} with ${files.length} files`);
    
    const batches: any[][] = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      batches.push(files.slice(i, i + BATCH_SIZE));
    }
    
    const totalBatches = batches.length;
    console.log(`Created ${totalBatches} batch(es)`);
    
    const allCandidates: any[] = [];
    let totalTokens = 0;
    
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const parallelRound = Math.floor(i / PARALLEL_BATCHES) + 1;
      const totalRounds = Math.ceil(batches.length / PARALLEL_BATCHES);
      
      const progress = Math.round(((i) / totalBatches) * 85);
      await updateJobProgress(
        supabase,
        jobId,
        progress,
        `Analisando lote ${parallelRound} de ${totalRounds}...`
      );
      
      const batchPromises: Promise<{ candidates: any[]; tokens: number }>[] = [];
      
      for (let j = 0; j < PARALLEL_BATCHES && i + j < batches.length; j++) {
        const batchIndex = i + j;
        batchPromises.push(
          processBatch(batches[batchIndex], jobDescription, apiKey, batchIndex + 1, totalBatches)
        );
      }
      
      try {
        const results = await Promise.all(batchPromises);
        for (const result of results) {
          allCandidates.push(...result.candidates);
          totalTokens += result.tokens;
        }
      } catch (parallelError) {
        console.error(`Parallel round ${parallelRound} had failures:`, parallelError);
        
        if (allCandidates.length > 0) {
          console.log(`Continuing with ${allCandidates.length} candidates from previous rounds`);
          break;
        }
        
        if (i === 0) {
          throw parallelError;
        }
      }
    }
    
    if (allCandidates.length === 0) {
      throw new Error("Não foi possível processar nenhum currículo");
    }
    
    await updateJobProgress(supabase, jobId, 90, "Gerando relatório final...");
    
    const { recommendation, comparison_summary, tokens: summaryTokens } = 
      await generateSummary(allCandidates, jobDescription, apiKey);
    
    totalTokens += summaryTokens;
    
    // Calculate duration in seconds
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    
    const finalResult = {
      candidates_analysis: allCandidates,
      recommendation,
      comparison_summary,
      tokens_used: totalTokens,
      duration_seconds: durationSeconds
    };
    
    await completeJob(supabase, jobId, finalResult, durationSeconds);
    console.log(`Job ${jobId} completed successfully. Duration: ${durationSeconds}s, Tokens: ${totalTokens}`);
    
    // Save to analyses table for history with job_title and job_posting_id
    const { error: analysisError } = await supabase
      .from("analyses")
      .insert({
        user_id: userId,
        job_description: jobDescription,
        job_title: jobTitle || null,
        job_posting_id: jobPostingId || null,
        candidates: allCandidates,
        results: finalResult,
        tokens_used: totalTokens,
        duration_seconds: durationSeconds,
        status: "completed"
      });
    
    if (analysisError) {
      console.error("Failed to save analysis to history:", analysisError);
    } else {
      console.log(`Analysis saved to history with title: ${jobTitle || 'N/A'}`);
      
      // Mark job posting as analyzed
      if (jobPostingId) {
        const { error: updateError } = await supabase
          .from("job_postings")
          .update({ analyzed_at: new Date().toISOString() })
          .eq("id", jobPostingId);
        
        if (updateError) {
          console.error("Failed to update job_posting analyzed_at:", updateError);
        } else {
          console.log(`Job posting ${jobPostingId} marked as analyzed`);
        }
      }
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Job ${jobId} failed:`, errorMessage);
    await failJob(supabase, jobId, errorMessage);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, jobDescription, user_id, job_title, job_posting_id } = await req.json();

    // Check if user is blocked
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: isBlocked } = await supabase.rpc("is_user_blocked", { _user_id: user_id });
    
    if (isBlocked) {
      return new Response(
        JSON.stringify({
          error: "Sua conta está bloqueada. Entre em contato com o administrador.",
          error_code: "USER_BLOCKED"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return new Response(
        JSON.stringify({
          error: "A descrição da vaga é muito curta ou está ausente.",
          error_code: "INSUFFICIENT_JOB_DESC"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Nenhum currículo foi enviado.",
          error_code: "NO_FILES"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Serviço temporariamente indisponível.",
          error_code: "CONFIG_ERROR"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: supabase client already created above for block check

    const { data: jobData, error: insertError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id,
        status: "processing",
        progress: 0,
        current_step: "Iniciando análise...",
        files_count: files.length
      })
      .select("id")
      .single();

    if (insertError || !jobData) {
      console.error("Failed to create analysis job:", insertError);
      return new Response(
        JSON.stringify({
          error: "Falha ao iniciar análise.",
          error_code: "ANALYSIS_ERROR"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobId = jobData.id;
    console.log(`Created analysis job: ${jobId} for ${files.length} files`);

    const job: AnalysisJob = {
      id: jobId,
      files,
      jobDescription,
      userId: user_id,
      jobTitle: job_title,
      jobPostingId: job_posting_id
    };

    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(processAnalysisInBackground(supabase, job, GEMINI_API_KEY));

    return new Response(
      JSON.stringify({ job_id: jobId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    console.error("Error in analyze-resumes:", errorMessage);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        error_code: getSanitizedErrorCode(errorMessage)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
