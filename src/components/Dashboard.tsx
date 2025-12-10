import { useState, useEffect } from "react";
import { Briefcase, Users, ArrowRight, Plus } from "lucide-react";
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

      // Calculate stats
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
    // Try to extract a title from the job description
    const lines = jobDescription.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length <= 100) return firstLine;
      return firstLine.substring(0, 97) + "...";
    }
    return "Análise sem título";
  };

  const extractSubtitle = (jobDescription: string) => {
    const text = jobDescription.replace(/\n/g, ' ').trim();
    if (text.length <= 80) return text;
    return text.substring(0, 77) + "...";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMM.", { locale: ptBR });
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário";

  return (
    <div className="px-4 py-8 md:px-8 max-w-5xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Bem-vindo de volta</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground uppercase tracking-tight">
            {userName.toUpperCase()}
          </h1>
        </div>
        <button
          onClick={onNewAnalysis}
          className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Análise
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-4xl font-bold text-foreground mb-1">{stats.totalAnalyses}</p>
          <p className="text-sm text-muted-foreground">Vagas analisadas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-4xl font-bold text-foreground mb-1">{stats.totalCandidates}</p>
          <p className="text-sm text-muted-foreground">Currículos analisados</p>
        </div>
      </div>

      {/* Recent Analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="bg-yellow-300 px-2 py-0.5 rounded text-sm font-medium text-foreground">
              Análises Recentes
            </span>
          </h2>
          {analyses.length > 5 && (
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Você ainda não realizou nenhuma análise.</p>
            <button
              onClick={onNewAnalysis}
              className="text-primary font-medium hover:underline"
            >
              Comece sua primeira análise
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
                  className="w-full bg-card border border-border rounded-xl p-4 hover:border-foreground/20 hover:shadow-sm transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {extractTitle(analysis.job_description)}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        Título: {extractSubtitle(analysis.job_description)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{candidateCount}</p>
                        <p className="text-xs">CVs</p>
                      </div>
                      <p className="hidden sm:block">{formatDate(analysis.created_at)}</p>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
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
