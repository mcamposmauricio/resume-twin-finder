import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Função para sanitizar erros e retornar mensagens amigáveis
function getSanitizedError(error: string): string {
  const errorMappings: Record<string, string> = {
    "API key not configured": "Algo inesperado ocorreu durante a análise. Tente novamente.",
    "Gemini API error": "Algo inesperado ocorreu durante a análise. Tente novamente.",
    "No response from AI": "Algo inesperado ocorreu durante a análise. Tente novamente.",
    "Failed to parse AI response": "Algo inesperado ocorreu durante a análise. Tente novamente.",
  };
  
  for (const [key, message] of Object.entries(errorMappings)) {
    if (error.includes(key)) {
      return message;
    }
  }
  
  return "Algo inesperado ocorreu durante a análise. Tente novamente.";
}

// Process a batch of files
async function processBatch(
  batchFiles: any[],
  jobDescription: string,
  apiKey: string,
  batchNumber: number,
  totalBatches: number
): Promise<{ candidates: any[]; tokens: number }> {
  console.log(`Processing batch ${batchNumber}/${totalBatches} with ${batchFiles.length} files...`);

  // Build the content parts for Gemini
  const parts: any[] = [
    {
      text: `DESCRIÇÃO DA VAGA:\n${jobDescription}\n\nCURRÍCULOS DOS CANDIDATOS:\n`
    }
  ];

  // Add each file as a part
  for (let i = 0; i < batchFiles.length; i++) {
    const file = batchFiles[i];
    parts.push({
      text: `\n--- CANDIDATO ${i + 1} (arquivo: ${file.name}) ---\n`
    });

    // Handle different file types
    if (file.type === "application/pdf") {
      parts.push({
        inline_data: {
          mime_type: "application/pdf",
          data: file.content
        }
      });
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      // Decode base64 for text files
      try {
        const decoded = atob(file.content);
        parts.push({ text: decoded });
      } catch {
        parts.push({ text: file.content });
      }
    }
  }

  parts.push({
    text: "\n\nAgora analise todos os candidatos e retorne o JSON conforme especificado."
  });

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }]
          },
          {
            role: "model",
            parts: [{ text: "Entendido. Vou analisar os currículos e fornecer uma análise detalhada em JSON." }]
          },
          {
            role: "user",
            parts: parts
          }
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
  console.log(`Batch ${batchNumber} - Gemini response received`);

  // Extract the response text
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    console.error(`Batch ${batchNumber} - No response text:`, JSON.stringify(data));
    throw new Error("No response from AI");
  }

  // Parse the JSON from the response
  const candidates = parseCandidatesFromResponse(responseText, batchNumber, batchFiles);
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

  console.log(`Batch ${batchNumber} - Parsed ${candidates.length} candidates, ${tokensUsed} tokens`);
  return { candidates, tokens: tokensUsed };
}

// Parse candidates from AI response
function parseCandidatesFromResponse(responseText: string, batchNumber: number, batchFiles: any[]): any[] {
  try {
    // Clean the response text
    let jsonStr = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Handle different response formats
    let candidates: any[];
    if (Array.isArray(parsed)) {
      candidates = parsed;
    } else if (parsed.candidates_analysis) {
      candidates = parsed.candidates_analysis;
    } else if (parsed.candidates) {
      candidates = parsed.candidates;
    } else {
      // Try to find candidates in any key
      const candidatesKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]) && parsed[k].length > 0 && parsed[k][0].candidate_name);
      if (candidatesKey) {
        candidates = parsed[candidatesKey];
      } else {
        throw new Error("Could not find candidates in response");
      }
    }

    // Add file names to candidates if missing
    return candidates.map((c: any, idx: number) => ({
      ...c,
      file_name: c.file_name || batchFiles[idx]?.name || `Arquivo ${idx + 1}`
    }));
  } catch (parseError) {
    console.error(`Batch ${batchNumber} - JSON parse error:`, parseError);
    console.error("First 500 chars:", responseText.substring(0, 500));
    
    // Try to salvage partial JSON
    try {
      const arrayMatch = responseText.match(/\[\s*\{[\s\S]*"candidate_name"[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        const candidates = JSON.parse(arrayMatch[0]);
        return candidates.map((c: any, idx: number) => ({
          ...c,
          file_name: c.file_name || batchFiles[idx]?.name || `Arquivo ${idx + 1}`
        }));
      }
      
      const objMatch = responseText.match(/\{[\s\S]*"candidates(?:_analysis)?"\s*:\s*\[[\s\S]*\]/);
      if (objMatch) {
        let partial = objMatch[0];
        if (!partial.endsWith("}")) {
          partial += '}';
        }
        const parsed = JSON.parse(partial);
        const candidates = parsed.candidates_analysis || parsed.candidates || [];
        return candidates.map((c: any, idx: number) => ({
          ...c,
          file_name: c.file_name || batchFiles[idx]?.name || `Arquivo ${idx + 1}`
        }));
      }
      
      throw new Error("Could not recover JSON structure");
    } catch (recoveryError) {
      console.error(`Batch ${batchNumber} - Recovery failed:`, recoveryError);
      throw new Error("Failed to parse AI response - response may have been truncated");
    }
  }
}

// Generate summary based on all candidates
async function generateSummary(
  allCandidates: any[],
  jobDescription: string,
  apiKey: string
): Promise<{ recommendation: string; comparison_summary: string; tokens: number }> {
  console.log("Generating summary for all candidates...");

  // Create a simplified version of candidates for summary
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ 
              text: `${SUMMARY_PROMPT}\n\nDESCRIÇÃO DA VAGA:\n${jobDescription.substring(0, 500)}...\n\nCANDIDATOS ANALISADOS:\n${JSON.stringify(candidateSummaries, null, 2)}`
            }]
          }
        ],
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, jobDescription } = await req.json();
    
    // Validar descrição da vaga
    if (!jobDescription || jobDescription.trim().length < 50) {
      return new Response(
        JSON.stringify({ 
          error_code: "INSUFFICIENT_JOB_DESC",
          error: "A descrição da vaga não contém informações suficientes para análise." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar arquivos
    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ 
          error_code: "NO_FILES",
          error: "Por favor, adicione pelo menos um currículo para análise." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error_code: "CONFIG_ERROR",
          error: "Algo inesperado ocorreu durante a análise. Tente novamente." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing ${files.length} resumes in batches of ${BATCH_SIZE}...`);

    // Split files into batches
    const batches: any[][] = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      batches.push(files.slice(i, i + BATCH_SIZE));
    }

    console.log(`Created ${batches.length} batch(es)`);

    // Process batches in parallel (PARALLEL_BATCHES at a time)
    const allCandidates: any[] = [];
    let totalTokens = 0;

    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const parallelRound = Math.floor(i / PARALLEL_BATCHES) + 1;
      const totalRounds = Math.ceil(batches.length / PARALLEL_BATCHES);
      console.log(`Processing parallel round ${parallelRound}/${totalRounds}...`);

      const batchPromises: Promise<{ candidates: any[]; tokens: number }>[] = [];

      // Queue up to PARALLEL_BATCHES batches to run in parallel
      for (let j = 0; j < PARALLEL_BATCHES && i + j < batches.length; j++) {
        const batchIndex = i + j;
        batchPromises.push(
          processBatch(
            batches[batchIndex],
            jobDescription,
            GEMINI_API_KEY,
            batchIndex + 1,
            batches.length
          )
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
        
        // If we have some candidates already, continue with what we have
        if (allCandidates.length > 0) {
          console.log(`Continuing with ${allCandidates.length} candidates from previous rounds`);
          break;
        }
        
        // If first round fails completely, try processing one by one
        if (i === 0) {
          console.log("Retrying first batch individually...");
          try {
            const { candidates, tokens } = await processBatch(
              batches[0],
              jobDescription,
              GEMINI_API_KEY,
              1,
              batches.length
            );
            allCandidates.push(...candidates);
            totalTokens += tokens;
          } catch (retryError) {
            console.error("Individual retry failed:", retryError);
            throw retryError;
          }
        }
      }
    }

    if (allCandidates.length === 0) {
      throw new Error("No candidates were processed successfully");
    }

    console.log(`Total candidates processed: ${allCandidates.length}`);

    // Generate summary based on all candidates
    const summary = await generateSummary(allCandidates, jobDescription, GEMINI_API_KEY);
    totalTokens += summary.tokens;

    console.log(`Analysis complete. Total tokens: ${totalTokens}`);

    return new Response(
      JSON.stringify({
        candidates_analysis: allCandidates,
        recommendation: summary.recommendation,
        comparison_summary: summary.comparison_summary,
        tokens_used: totalTokens
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-resumes function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ 
        error_code: "ANALYSIS_ERROR",
        error: getSanitizedError(errorMessage)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
