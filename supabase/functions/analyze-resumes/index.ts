import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um especialista sênior em RH e recrutamento. Sua tarefa é analisar currículos de candidatos em relação a uma descrição de vaga específica.

Para CADA candidato, você deve fornecer uma análise detalhada incluindo:

1. **match_score** (0-100): Pontuação geral de compatibilidade com a vaga
2. **technical_fit** (0-100): Adequação técnica às requirements da vaga
3. **potential_fit** (0-100): Potencial de crescimento e adaptação
4. **summary**: Resumo de 2-3 frases sobre o candidato
5. **years_experience**: Anos de experiência estimados
6. **soft_skills**: Array de 5-8 soft skills com scores (0-100)
7. **cultural_fit**: Objeto com results_orientation, process_orientation, people_orientation, innovation_orientation (todos 0-100)
8. **red_flags**: Array de pontos de atenção ou alertas
9. **gap_analysis**: Objeto com strong_match, moderate_match, weak_or_missing (arrays de skills)
10. **inferred_info**: Objeto com seniority_level, estimated_salary_range, tools_and_technologies[], industry_experience[], education_level, languages[], certifications[], leadership_experience, remote_work_compatibility, availability

Também forneça:
- **recommendation**: Sua recomendação de quem contratar e por quê
- **comparison_summary**: Resumo comparativo de todos os candidatos

IMPORTANTE: 
- Extraia o nome do candidato do currículo. Se não encontrar, use "Candidato" + número
- Seja objetivo e baseie-se apenas nas informações fornecidas
- Red flags devem ser pontos genuínos de atenção, não apenas observações neutras

Responda APENAS com JSON válido no seguinte formato:
{
  "candidates": [...],
  "recommendation": "...",
  "comparison_summary": "..."
}`;

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
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
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
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, responseText];
      const jsonStr = jsonMatch[1] || responseText;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
      throw new Error("Failed to parse AI response");
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
