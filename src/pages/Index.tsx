import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { InputSection } from "@/components/InputSection";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ResultsSection } from "@/components/ResultsSection";
import { ErrorScreen } from "@/components/ErrorScreen";
import type { AppStep, UploadedFile, AnalysisResult } from "@/types";

export default function Index() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

      // Validate response structure
      if (!data.candidates || !Array.isArray(data.candidates)) {
        throw new Error("Resposta inválida da IA");
      }

      setResults(data);
      setTokensUsed(data.tokens_used || 0);
      setStep("results");

      // Save analysis to database
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
  };

  const handleRetry = () => {
    setStep("input");
    setErrorMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStepNumber = () => {
    if (step === "welcome") return 0;
    if (step === "input") return 1;
    if (step === "loading") return 2;
    if (step === "results") return 3;
    return 1;
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-700" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">CompareCV</h1>
          </div>

          {/* Progress Indicator */}
          {step !== "welcome" && step !== "error" && (
            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                      getStepNumber() >= num
                        ? "bg-blue-700 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {num}
                  </div>
                  {num < 3 && (
                    <div
                      className={`w-8 h-1 ${
                        getStepNumber() > num ? "bg-blue-700" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {step === "welcome" && <WelcomeScreen onStart={() => setStep("input")} />}
        {step === "input" && (
          <InputSection onAnalyze={handleAnalyze} isLoading={false} />
        )}
        {step === "loading" && <LoadingScreen />}
        {step === "results" && results && (
          <ResultsSection
            results={results}
            tokensUsed={tokensUsed}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
        {step === "error" && (
          <ErrorScreen message={errorMessage} onRetry={handleRetry} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-slate-500 border-t border-slate-200 bg-white">
        <p>CompareCV © {new Date().getFullYear()} - Análise Inteligente de Currículos</p>
        {tokensUsed > 0 && (
          <p className="mt-1">Tokens utilizados nesta sessão: {tokensUsed.toLocaleString()}</p>
        )}
      </footer>
    </div>
  );
}
