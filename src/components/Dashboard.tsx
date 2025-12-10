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
    <div className="px-4 py-10 md:px-8 max-w-5xl mx-auto animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
        <div>
          <p className="text-muted-foreground mb-2">Bem-vindo de volta,</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {userName}
          </h1>
        </div>
        <button
          onClick={onNewAnalysis}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Nova Análise
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="card-clean">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{stats.totalAnalyses}</p>
              <p className="text-muted-foreground">Vagas analisadas</p>
            </div>
          </div>
        </div>
        <div className="card-clean">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{stats.totalCandidates}</p>
              <p className="text-muted-foreground">Currículos analisados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Análises Recentes
          </h2>
          {analyses.length > 5 && (
            <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-clean animate-pulse">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="card-clean text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">Você ainda não realizou nenhuma análise.</p>
            <button
              onClick={onNewAnalysis}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Começar primeira análise
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.slice(0, 5).map((analysis) => {
              const candidateCount = Array.isArray(analysis.candidates) ? analysis.candidates.length : 0;
              
              return (
                <button
                  key={analysis.id}
                  onClick={() => onViewAnalysis(analysis.id)}
                  className="w-full card-hover text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {extractTitle(analysis.job_description)}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {candidateCount} CVs
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(analysis.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
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
