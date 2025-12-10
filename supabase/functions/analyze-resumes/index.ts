import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

Também forneça:
- **recommendation**: Recomendação curta (1-2 frases)
- **comparison_summary**: Resumo comparativo curto (2-3 frases)

REGRAS CRÍTICAS:
- Responda APENAS com JSON válido, SEM markdown, SEM \`\`\`
- Mantenha respostas CONCISAS para evitar truncamento
- soft_skills DEVE ser array de objetos: [{"name": "Comunicação", "score": 85}]`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, jobDescription } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      throw new Error("API key not configured");
    }

    console.log(`Analyzing ${files.length} resumes...`);

    // Build the content parts for Gemini
    const parts: any[] = [
      {
        text: `DESCRIÇÃO DA VAGA:\n${jobDescription}\n\nCURRÍCULOS DOS CANDIDATOS:\n`
      }
    ];

    // Add each file as a part
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
      } else if (file.type.includes("word") || file.name.endsWith(".docx")) {
        // For DOCX, send as binary and let Gemini handle it
        parts.push({
          inline_data: {
            mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            data: file.content
          }
        });
      }
    }

    parts.push({
      text: "\n\nAgora analise todos os candidatos e retorne o JSON conforme especificado."
    });

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
            maxOutputTokens: 65536,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini response received");

    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      console.error("No response text from Gemini:", JSON.stringify(data));
      throw new Error("No response from AI");
    }

    // Parse the JSON from the response
    let analysisResult;
    try {
      // Clean the response text
      let jsonStr = responseText.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }
      
      const parsed = JSON.parse(jsonStr);
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        // Response is an array of candidates directly
        analysisResult = {
          candidates_analysis: parsed,
          recommendation: "Análise completa dos candidatos.",
          comparison_summary: "Veja a tabela comparativa para detalhes."
        };
        console.log("Parsed array response, wrapped in object");
      } else if (parsed.candidates_analysis) {
        // Response has candidates_analysis key
        analysisResult = parsed;
        console.log("Parsed object with candidates_analysis");
      } else if (parsed.candidates) {
        // Response has candidates key
        analysisResult = {
          ...parsed,
          candidates_analysis: parsed.candidates
        };
        console.log("Parsed object with candidates key");
      } else {
        // Try to find candidates in any key
        const candidatesKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]) && parsed[k].length > 0 && parsed[k][0].candidate_name);
        if (candidatesKey) {
          analysisResult = {
            ...parsed,
            candidates_analysis: parsed[candidatesKey]
          };
          console.log(`Found candidates in key: ${candidatesKey}`);
        } else {
          throw new Error("Could not find candidates in response");
        }
      }
      console.log(`Successfully parsed JSON with ${analysisResult.candidates_analysis?.length || 0} candidates`);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("First 500 chars:", responseText.substring(0, 500));
      console.error("Last 500 chars:", responseText.substring(responseText.length - 500));
      
      // Try to salvage partial JSON - look for array or object patterns
      try {
        // First try to find an array
        const arrayMatch = responseText.match(/\[\s*\{[\s\S]*"candidate_name"[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          const candidates = JSON.parse(arrayMatch[0]);
          analysisResult = {
            candidates_analysis: candidates,
            recommendation: "Análise recuperada parcialmente.",
            comparison_summary: "Alguns dados podem estar incompletos."
          };
          console.log("Recovered array from partial response");
        } else {
          // Try object pattern
          const objMatch = responseText.match(/\{[\s\S]*"candidates(?:_analysis)?"\s*:\s*\[[\s\S]*\]/);
          if (objMatch) {
            let partial = objMatch[0];
            if (!partial.endsWith("}")) {
              partial += '}';
            }
            analysisResult = JSON.parse(partial);
            if (analysisResult.candidates && !analysisResult.candidates_analysis) {
              analysisResult.candidates_analysis = analysisResult.candidates;
            }
            console.log("Recovered object from partial response");
          } else {
            throw new Error("Could not recover JSON structure");
          }
        }
      } catch (recoveryError) {
        console.error("Recovery failed:", recoveryError);
        throw new Error("Failed to parse AI response - response may have been truncated");
      }
    }

    // Add file names to candidates if missing
    if (analysisResult.candidates) {
      analysisResult.candidates = analysisResult.candidates.map((c: any, idx: number) => ({
        ...c,
        file_name: c.file_name || files[idx]?.name || `Arquivo ${idx + 1}`
      }));
    }

    // Get token usage
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return new Response(
      JSON.stringify({
        ...analysisResult,
        tokens_used: tokensUsed
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-resumes function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
