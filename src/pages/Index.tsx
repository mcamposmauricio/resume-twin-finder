import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dashboard } from "@/components/Dashboard";
import { InputSection } from "@/components/InputSection";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ResultsSection } from "@/components/ResultsSection";
import { ErrorScreen } from "@/components/ErrorScreen";
import type { AppStep, UploadedFile, AnalysisResult, CandidateResult } from "@/types";
import logoMarq from "@/assets/logo-marq-blue.png";

export default function Index() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
  };

  const handleAnalyze = async (files: UploadedFile[], jobDescription: string) => {
    setStep("loading");
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-resumes", {
        body: { files, jobDescription },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erro ao analisar currículos");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Raw AI response:", data);

      let candidatesArray: any[] = [];
      
      if (data.candidates_analysis && Array.isArray(data.candidates_analysis)) {
        candidatesArray = data.candidates_analysis;
      } else if (data.candidates && Array.isArray(data.candidates)) {
        candidatesArray = data.candidates;
      } else {
        const numericKeys = Object.keys(data).filter(key => !isNaN(Number(key))).sort((a, b) => Number(a) - Number(b));
        if (numericKeys.length > 0) {
          candidatesArray = numericKeys.map(key => data[key]);
          console.log("Extracted candidates from numeric keys:", candidatesArray.length);
        }
      }

      if (candidatesArray.length === 0) {
        console.error("No candidates found in response:", data);
        throw new Error("Nenhum candidato encontrado na resposta da IA");
      }

      const normalizedData = {
        candidates: candidatesArray.map((c: any, idx: number) => ({
          candidate_name: c.candidate_name || c.name || `Candidato ${idx + 1}`,
          file_name: c.file_name || `Arquivo ${idx + 1}`,
          match_score: c.match_score ?? 0,
          technical_fit: c.technical_fit ?? 0,
          potential_fit: c.potential_fit ?? 0,
          summary: c.summary || "",
          years_experience: c.years_experience ?? 0,
          soft_skills: Array.isArray(c.soft_skills) 
            ? c.soft_skills.map((s: any) => {
                if (s.name && typeof s.score === 'number') {
                  return s;
                }
                const key = Object.keys(s)[0];
                return { name: key, score: s[key] };
              })
            : [],
          cultural_fit: c.cultural_fit || {
            results_orientation: 50,
            process_orientation: 50,
            people_orientation: 50,
            innovation_orientation: 50,
          },
          red_flags: Array.isArray(c.red_flags) ? c.red_flags : [],
          gap_analysis: c.gap_analysis || {
            strong_match: [],
            moderate_match: [],
            weak_or_missing: [],
          },
          inferred_info: c.inferred_info || {
            seniority_level: "N/A",
            estimated_salary_range: "N/A",
            tools_and_technologies: [],
            industry_experience: [],
            education_level: "N/A",
            languages: [],
            certifications: [],
            leadership_experience: "N/A",
            remote_work_compatibility: "N/A",
            availability: "N/A",
          },
        })),
        recommendation: data.recommendation || "Análise concluída. Revise os candidatos acima.",
        comparison_summary: data.comparison_summary || "Todos os candidatos foram analisados com base na descrição da vaga.",
      };

      setResults(normalizedData);
      setTokensUsed(data.tokens_used || 0);
      setStep("results");

      if (user) {
        const { error: saveError } = await supabase.from("analyses").insert({
          user_id: user.id,
          job_description: jobDescription,
          candidates: files.map((f) => ({ name: f.name })),
          results: data,
          tokens_used: data.tokens_used || 0,
        });
        if (saveError) {
          console.error("Error saving analysis:", saveError);
        }
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      setErrorMessage(error.message || "Erro ao processar a análise. Tente novamente.");
      setStep("error");
    }
  };

  const handleNewAnalysis = () => {
    setStep("input");
    setResults(null);
    setTokensUsed(0);
    setErrorMessage("");
    setSelectedAnalysisId(null);
  };

  const handleRetry = () => {
    setStep("input");
    setErrorMessage("");
  };

  const handleViewAnalysis = async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", analysisId)
        .single();

      if (error) throw error;

      if (data?.results) {
        const rawResults = data.results as Record<string, unknown>;
        
        // Normalize the results - handle both candidates and candidates_analysis
        const candidates = rawResults.candidates_analysis || rawResults.candidates || [];
        
        const normalizedResults: AnalysisResult = {
          candidates: candidates as CandidateResult[],
          recommendation: (rawResults.recommendation as string) || "",
          comparison_summary: (rawResults.comparison_summary as string) || "",
        };
        
        setResults(normalizedResults);
        setTokensUsed(data.tokens_used || 0);
        setSelectedAnalysisId(analysisId);
        setStep("results");
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
      toast.error("Erro ao carregar análise");
    }
  };

  const handleBackToDashboard = () => {
    setStep("welcome");
    setResults(null);
    setSelectedAnalysisId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 bg-primary rounded-xl">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CompareCV <span className="text-primary text-xs font-normal">powered by MarQ</span></span>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {step === "welcome" && (
          <Dashboard 
            user={user} 
            onNewAnalysis={handleNewAnalysis} 
            onViewAnalysis={handleViewAnalysis}
          />
        )}
        {step === "input" && (
          <div className="max-w-5xl mx-auto">
            <InputSection onAnalyze={handleAnalyze} isLoading={false} />
          </div>
        )}
        {step === "loading" && <LoadingScreen />}
        {step === "results" && results && (
          <ResultsSection
            results={results}
            tokensUsed={tokensUsed}
            onNewAnalysis={handleNewAnalysis}
            onBack={handleBackToDashboard}
          />
        )}
        {step === "error" && (
          <ErrorScreen message={errorMessage} onRetry={handleRetry} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border bg-card">
        <div className="flex items-center justify-center gap-2">
          <span>CompareCV powered by</span>
          <img src={logoMarq} alt="MarQ HR" className="h-5" />
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
