import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dashboard } from "@/components/Dashboard";
import { InputSection } from "@/components/InputSection";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ResultsSection } from "@/components/ResultsSection";
import { ErrorScreen } from "@/components/ErrorScreen";
import { ReferralDialog } from "@/components/ReferralDialog";
import { MarqBanner } from "@/components/MarqBanner";
import { useResumeBalance } from "@/hooks/useResumeBalance";
import { useUserRole } from "@/hooks/useUserRole";
import { logActivity } from "@/hooks/useActivityLog";
import type { AppStep, UploadedFile, AnalysisResult, CandidateResult } from "@/types";

interface DraftData {
  id?: string;
  files: UploadedFile[];
  jobTitle: string;
  jobDescription: string;
}
import logoMarq from "@/assets/logo-marq-blue.png";

export default function Index() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [currentDraft, setCurrentDraft] = useState<DraftData | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { availableResumes, maxPerAnalysis, loading: balanceLoading, refetch: refetchBalance } = useResumeBalance(user?.id);
  const { isFullAccess, loading: roleLoading } = useUserRole(user?.id);
  
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

  // Store pending analysis job ID for processing after functions are defined
  const [pendingAnalysisJobId, setPendingAnalysisJobId] = useState<string | null>(null);

  // Handle URL-based analysis job polling (from JobPostingDetails redirect)
  useEffect(() => {
    const analysisJobId = searchParams.get("analysisJobId");
    if (analysisJobId && user) {
      // Clear the URL parameter
      setSearchParams({});
      setPendingAnalysisJobId(analysisJobId);
    }
  }, [searchParams, user]);

  // Handle URL-based analysis viewing (from activity log)
  useEffect(() => {
    const viewAnalysisId = searchParams.get("viewAnalysis");
    if (viewAnalysisId && user) {
      // Clear the URL parameter
      setSearchParams({});
      // Load and display the analysis
      loadAnalysisById(viewAnalysisId);
    }
  }, [searchParams, user]);

  const loadAnalysisById = async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", analysisId)
        .maybeSingle();

      if (error || !data) {
        toast.error("Análise não encontrada");
        return;
      }

      // Parse and display results
      const results = data.results as any;
      if (results) {
        let candidatesArray: any[] = [];
        
        if (results.candidates_analysis && Array.isArray(results.candidates_analysis)) {
          candidatesArray = results.candidates_analysis;
        } else if (results.candidates && Array.isArray(results.candidates)) {
          candidatesArray = results.candidates;
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
                  if (s.name && typeof s.score === 'number') return s;
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
          recommendation: results.recommendation || "Análise concluída.",
          comparison_summary: results.comparison_summary || "Veja a tabela comparativa.",
        };

        setResults(normalizedData);
        setDurationSeconds(data.duration_seconds || undefined);
        setCurrentJobTitle(data.job_title || undefined);
        setSelectedAnalysisId(analysisId);
        setStep("results");
      }
    } catch (err) {
      console.error("Error loading analysis:", err);
      toast.error("Erro ao carregar análise");
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
  };

  const [currentJobTitle, setCurrentJobTitle] = useState<string | undefined>();

  // Mapeamento de códigos de erro para mensagens amigáveis
  const getFriendlyErrorMessage = (errorCode?: string, defaultMessage?: string): string => {
    const errorMessages: Record<string, string> = {
      "INSUFFICIENT_JOB_DESC": "A descrição da vaga não contém informações suficientes para análise. Tente incluir título da posição, requisitos técnicos, responsabilidades e nível de senioridade.",
      "NO_FILES": "Por favor, adicione pelo menos um currículo para análise.",
      "INVALID_FILE": "Arquivo inválido ou em formato diferente de um currículo tradicional. Verifique se o documento contém informações profissionais, como experiência e formação.",
      "CONFIG_ERROR": "Algo inesperado ocorreu durante a análise. Tente novamente.",
      "ANALYSIS_ERROR": "Algo inesperado ocorreu durante a análise. Tente novamente.",
    };

    if (errorCode && errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }

    return defaultMessage || "Algo inesperado ocorreu durante a análise. Tente novamente ou revise as informações enviadas.";
  };

  // Function to link job applications to analysis after completion
  const linkApplicationsToAnalysis = async (analysisId: string) => {
    const pendingAppIds = sessionStorage.getItem('pendingAnalysisApplicationIds');
    const pendingJobPostingId = sessionStorage.getItem('pendingAnalysisJobPostingId');
    
    if (pendingAppIds && pendingJobPostingId) {
      try {
        const applicationIds = JSON.parse(pendingAppIds) as string[];
        
        // Update applications with analysis_id
        const { error } = await supabase
          .from('job_applications')
          .update({ analysis_id: analysisId, status: 'analyzed' })
          .in('id', applicationIds);

        if (error) {
          console.error('Error linking applications to analysis:', error);
        } else {
          console.log('Successfully linked applications to analysis:', applicationIds.length);
        }
      } catch (e) {
        console.error('Error parsing pending application IDs:', e);
      } finally {
        // Clean up sessionStorage
        sessionStorage.removeItem('pendingAnalysisApplicationIds');
        sessionStorage.removeItem('pendingAnalysisJobPostingId');
      }
    }
  };

  // Polling function for job-based analysis (used by both direct and URL-redirect flows)
  const startPollingForJob = (jobId: string, files?: UploadedFile[], jobDescription?: string, jobTitle?: string) => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "check-analysis-status",
          { body: { job_id: jobId } }
        );

        if (statusError) {
          console.error("Status check error:", statusError);
          return;
        }

        console.log("Status update:", statusData);
        
        setAnalysisProgress(statusData.progress || 0);
        setAnalysisStep(statusData.current_step || "Processando...");

        if (statusData.status === "completed") {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Process and save results
          await processAnalysisResultFromJob(statusData.result, jobId);
        } else if (statusData.status === "error") {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Clean up pending data
          sessionStorage.removeItem('pendingAnalysisApplicationIds');
          sessionStorage.removeItem('pendingAnalysisJobPostingId');
          
          setErrorMessage(getFriendlyErrorMessage(undefined, statusData.error_message));
          setStep("error");
        }
      } catch (pollError) {
        console.error("Polling error:", pollError);
      }
    }, 3000); // Poll every 3 seconds
  };

  // Effect to start polling when pendingAnalysisJobId is set (after redirect from JobPostingDetails)
  useEffect(() => {
    if (pendingAnalysisJobId) {
      setStep("loading");
      setAnalysisProgress(0);
      setAnalysisStep("Continuando análise...");
      startPollingForJob(pendingAnalysisJobId);
      setPendingAnalysisJobId(null);
    }
  }, [pendingAnalysisJobId]);

  // Process results from job-based analysis (from URL redirect)
  const processAnalysisResultFromJob = async (data: any, jobId: string) => {
    console.log("Processing analysis result from job:", data);

    let candidatesArray: any[] = [];
    
    if (data.candidates_analysis && Array.isArray(data.candidates_analysis)) {
      candidatesArray = data.candidates_analysis;
    } else if (data.candidates && Array.isArray(data.candidates)) {
      candidatesArray = data.candidates;
    } else {
      const numericKeys = Object.keys(data).filter(key => !isNaN(Number(key))).sort((a, b) => Number(a) - Number(b));
      if (numericKeys.length > 0) {
        candidatesArray = numericKeys.map(key => data[key]);
      }
    }

    if (candidatesArray.length === 0) {
      console.error("No candidates found in response:", data);
      setErrorMessage("Não foi possível processar os currículos enviados.");
      setStep("error");
      return;
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
              if (s.name && typeof s.score === 'number') return s;
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
    setDurationSeconds(data.duration_seconds);
    setStep("results");

    // Analysis is already saved by the Edge Function
    // Just fetch the most recent analysis to link applications
    if (user) {
      const { data: recentAnalysis } = await supabase
        .from("analyses")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentAnalysis) {
        await linkApplicationsToAnalysis(recentAnalysis.id);
      }
      refetchBalance();
    }
  };

  const processAnalysisResult = async (data: any, files: UploadedFile[], jobDescription: string, jobTitle?: string) => {
    console.log("Processing analysis result:", data);

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
      throw new Error("Não foi possível processar os currículos enviados. Verifique se os arquivos contêm informações válidas de candidatos.");
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
    setDurationSeconds(data.duration_seconds);
    setStep("results");

    // Analysis is already saved by the Edge Function
    // Only update if there was a draft being edited
    if (user) {
      if (currentDraft?.id) {
        // Update existing draft to completed
        const { error: updateError } = await supabase
          .from("analyses")
          .update({
            job_title: jobTitle || null,
            job_description: jobDescription,
            candidates: files.map((f) => ({ name: f.name })),
            results: data,
            tokens_used: data.tokens_used || 0,
            status: "completed",
          })
          .eq("id", currentDraft.id);
        
        if (updateError) {
          console.error("Error updating analysis:", updateError);
        } else {
          setCurrentDraft(null);
        }
      }
      // Always refetch balance (Edge Function already saved the analysis)
      refetchBalance();
    }
  };

  const handleAnalyze = async (files: UploadedFile[], jobDescription: string, jobTitle?: string) => {
    // Check if user is blocked before starting analysis
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profile?.is_blocked) {
        toast.error("Sua conta está bloqueada. Entre em contato com o administrador para mais informações.");
        return;
      }
    } catch (err) {
      console.error("Error checking block status:", err);
    }

    setStep("loading");
    setCurrentJobTitle(jobTitle);
    setAnalysisProgress(0);
    setAnalysisStep("Iniciando análise...");
    
    try {
      // Call the edge function to start analysis
      const { data, error } = await supabase.functions.invoke("analyze-resumes", {
        body: { files, jobDescription, user_id: user?.id, job_title: jobTitle },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(getFriendlyErrorMessage(undefined, error.message));
      }

      if (data.error) {
        throw new Error(getFriendlyErrorMessage(data.error_code, data.error));
      }

      // Check if we got a job_id (async mode) or direct results (fallback)
      if (data.job_id) {
        console.log("Analysis started with job_id:", data.job_id);
        
        // Start polling for status
        const jobId = data.job_id;
        
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const { data: statusData, error: statusError } = await supabase.functions.invoke(
              "check-analysis-status",
              { body: { job_id: jobId } }
            );

            if (statusError) {
              console.error("Status check error:", statusError);
              return;
            }

            console.log("Status update:", statusData);
            
            setAnalysisProgress(statusData.progress || 0);
            setAnalysisStep(statusData.current_step || "Processando...");

            if (statusData.status === "completed") {
              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              
              // Process results
              await processAnalysisResult(statusData.result, files, jobDescription, jobTitle);
            } else if (statusData.status === "error") {
              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              
              setErrorMessage(getFriendlyErrorMessage(undefined, statusData.error_message));
              setStep("error");
            }
          } catch (pollError) {
            console.error("Polling error:", pollError);
          }
        }, 3000); // Poll every 3 seconds
      } else {
        // Direct results (fallback for backward compatibility)
        await processAnalysisResult(data, files, jobDescription, jobTitle);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      
      // Log error activity
      logActivity({
        userId: user?.id || 'unknown',
        userEmail: user?.email || 'unknown',
        actionType: 'analysis_error',
        isError: true,
        metadata: {
          error_message: error.message || 'Unknown error',
          context: 'analyze-resumes edge function',
          files_count: files.length,
        },
      });
      
      // Stop polling if active
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      setErrorMessage(error.message || "Algo inesperado ocorreu durante a análise. Tente novamente ou revise as informações enviadas.");
      setStep("error");
    }
  };

  const handleNewAnalysis = () => {
    // Stop any active polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setStep("input");
    setResults(null);
    setDurationSeconds(undefined);
    setErrorMessage("");
    setSelectedAnalysisId(null);
    setCurrentDraft(null);
    setAnalysisProgress(0);
    setAnalysisStep("");
  };

  const handleSaveDraft = async (files: UploadedFile[], jobDescription: string, jobTitle?: string) => {
    if (!user) return;
    
    try {
      const candidatesData = files.map((f) => ({ name: f.name, content: f.content, type: f.type }));
      
      if (currentDraft?.id) {
        // Update existing draft
        const { error } = await supabase
          .from("analyses")
          .update({
            job_title: jobTitle || null,
            job_description: jobDescription || "",
            candidates: candidatesData,
          })
          .eq("id", currentDraft.id);
        
        if (error) throw error;
        toast.success("Rascunho atualizado com sucesso!");
      } else {
        // Create new draft
        const { error } = await supabase.from("analyses").insert({
          user_id: user.id,
          job_title: jobTitle || null,
          job_description: jobDescription || "",
          candidates: candidatesData,
          status: "draft",
        });
        
        if (error) throw error;
        toast.success("Rascunho salvo com sucesso!");
      }
      
      setStep("welcome");
      setCurrentDraft(null);
    } catch (error: any) {
      console.error("Error saving draft:", error);
      logActivity({
        userId: user?.id || 'unknown',
        userEmail: user?.email || 'unknown',
        actionType: 'draft_save_error',
        isError: true,
        metadata: { error_message: error.message },
      });
      toast.error("Erro ao salvar rascunho. Tente novamente.");
    }
  };

  const handleContinueDraft = async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", analysisId)
        .single();

      if (error) throw error;

      if (data) {
        const candidates = Array.isArray(data.candidates) ? data.candidates : [];
        const draftFiles: UploadedFile[] = candidates.map((c: any) => ({
          name: c.name || "Arquivo",
          content: c.content || "",
          type: c.type || "application/pdf",
        }));

        setCurrentDraft({
          id: data.id,
          files: draftFiles,
          jobTitle: data.job_title || "",
          jobDescription: data.job_description || "",
        });
        setStep("input");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error("Erro ao carregar rascunho");
    }
  };

  const handleRetry = () => {
    // Stop any active polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setStep("input");
    setErrorMessage("");
    setAnalysisProgress(0);
    setAnalysisStep("");
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
        setDurationSeconds((rawResults as any).duration_seconds);
        setSelectedAnalysisId(analysisId);
        setStep("results");
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
      toast.error("Erro ao carregar análise");
    }
  };

  const handleBackToDashboard = () => {
    // Stop any active polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setStep("welcome");
    setResults(null);
    setSelectedAnalysisId(null);
    setCurrentDraft(null);
    setAnalysisProgress(0);
    setAnalysisStep("");
  };

  // Redirect full_access users to /vagas when on welcome step
  useEffect(() => {
    if (!loading && !roleLoading && user && isFullAccess && step === 'welcome') {
      // Only redirect if there's no pending analysis or URL params
      const hasUrlParams = searchParams.get('analysisJobId') || searchParams.get('viewAnalysis');
      if (!hasUrlParams) {
        navigate('/vagas', { replace: true });
      }
    }
  }, [loading, roleLoading, user, isFullAccess, step, navigate, searchParams]);

  // Show loading while checking role for full_access redirect (prevents flash)
  if (loading || (!roleLoading && user && isFullAccess && step === 'welcome' && !searchParams.get('analysisJobId') && !searchParams.get('viewAnalysis'))) {
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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent">
                CompareCV
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">powered by</span>
                <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
                </a>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            {!balanceLoading && (
              <span className="text-xs sm:text-sm bg-primary/10 text-primary px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium whitespace-nowrap">
                {availableResumes} {availableResumes === 1 ? 'currículo' : 'currículos'} <span className="hidden sm:inline">para analisar</span>
              </span>
            )}
            {user && <ReferralDialog userId={user.id} />}
            <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[150px]">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* MarQ Promotional Banner */}
      <MarqBanner userId={user?.id} />

      {/* Main Content */}
      <main className="flex-1">
        {step === "welcome" && (
          <Dashboard 
            user={user}
            isFullAccess={isFullAccess}
            onNewAnalysis={handleNewAnalysis} 
            onViewAnalysis={handleViewAnalysis}
            onContinueDraft={handleContinueDraft}
            onNavigateToJobs={() => navigate("/vagas")}
            onNavigateToForms={() => navigate("/formularios")}
          />
        )}
        {step === "input" && (
          <div className="max-w-5xl mx-auto">
            <InputSection 
              onAnalyze={handleAnalyze}
              onSaveDraft={handleSaveDraft}
              isLoading={false} 
              maxFiles={maxPerAnalysis}
              availableBalance={availableResumes}
              initialDraft={currentDraft}
              userId={user?.id}
            />
          </div>
        )}
        {step === "loading" && (
          <LoadingScreen 
            progress={analysisProgress} 
            currentStep={analysisStep}
          />
        )}
        {step === "results" && results && (
          <ResultsSection
            results={results}
            durationSeconds={durationSeconds}
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
          <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer">
            <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
          </a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
