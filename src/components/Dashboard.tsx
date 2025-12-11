import { useState, useEffect } from "react";
import { Briefcase, Users, ArrowRight, Plus, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardProps {
  user: any;
  onNewAnalysis: () => void;
  onViewAnalysis: (analysisId: string) => void;
}

interface Analysis {
  id: string;
  job_title: string | null;
  job_description: string;
  candidates: any;
  created_at: string;
}

export function Dashboard({ user, onNewAnalysis, onViewAnalysis }: DashboardProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAnalyses: 0, totalCandidates: 0 });

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const analysesData = data || [];
      setAnalyses(analysesData);

      const totalAnalyses = analysesData.length;
      const totalCandidates = analysesData.reduce((acc, analysis) => {
        const candidates = Array.isArray(analysis.candidates) ? analysis.candidates : [];
        return acc + candidates.length;
      }, 0);

      setStats({ totalAnalyses, totalCandidates });
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisTitle = (analysis: Analysis) => {
    if (analysis.job_title) {
      return analysis.job_title.length > 60 
        ? analysis.job_title.substring(0, 57) + "..." 
        : analysis.job_title;
    }
    return extractTitle(analysis.job_description);
  };

  const extractTitle = (jobDescription: string) => {
    const lines = jobDescription.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length <= 60) return firstLine;
      return firstLine.substring(0, 57) + "...";
    }
    return "Análise sem título";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy", { locale: ptBR });
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário";

  return (
    <div className="px-4 py-6 sm:py-10 md:px-8 max-w-5xl mx-auto animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
        <div>
          <p className="text-sm sm:text-base text-muted-foreground mb-1 sm:mb-2">Bem-vindo de volta,</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            {userName}
          </h1>
        </div>
        <button
          onClick={onNewAnalysis}
          className="btn-primary text-sm sm:text-base py-2.5 sm:py-3"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Nova Análise
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-12">
        <div className="card-clean p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalAnalyses}</p>
              <p className="text-xs sm:text-base text-muted-foreground truncate">Vagas analisadas</p>
            </div>
          </div>
        </div>
        <div className="card-clean p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-7 sm:h-7 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalCandidates}</p>
              <p className="text-xs sm:text-base text-muted-foreground truncate">CVs analisados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            Análises Recentes
          </h2>
          {analyses.length > 5 && (
            <button className="text-xs sm:text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-clean animate-pulse p-4 sm:p-6">
                <div className="h-4 sm:h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 sm:h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="card-clean text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">Você ainda não realizou nenhuma análise.</p>
            <button
              onClick={onNewAnalysis}
              className="btn-primary text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Começar primeira análise
            </button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {analyses.slice(0, 5).map((analysis) => {
              const candidateCount = Array.isArray(analysis.candidates) ? analysis.candidates.length : 0;
              
              return (
                <button
                  key={analysis.id}
                  onClick={() => onViewAnalysis(analysis.id)}
                  className="w-full card-hover text-left group p-3 sm:p-4 md:p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-foreground truncate">
                          {getAnalysisTitle(analysis)}
                        </h3>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                            {candidateCount} CVs
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            {formatDate(analysis.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
