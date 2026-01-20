import { useState, useEffect } from "react";
import { Briefcase, Users, ArrowRight, Plus, FileText, Calendar, Clock, Settings, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardProps {
  user: any;
  onNewAnalysis: () => void;
  onViewAnalysis: (analysisId: string) => void;
  onContinueDraft: (analysisId: string) => void;
  onNavigateToJobs: () => void;
  onNewJobPosting: () => void;
  onNavigateToForms: () => void;
}

interface Analysis {
  id: string;
  job_title: string | null;
  job_description: string;
  candidates: any;
  created_at: string;
  status: string;
}

export function Dashboard({ user, onNewAnalysis, onViewAnalysis, onContinueDraft, onNavigateToJobs, onNewJobPosting, onNavigateToForms }: DashboardProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAnalyses: 0, totalCandidates: 0, activeJobs: 0, totalApplications: 0 });
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchAnalyses();
    fetchJobPostings();
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      // Use name from profile, or fallback to email
      const displayName = data?.name || user?.email?.split('@')[0] || "Usuário";
      setUserName(displayName);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserName(user?.email?.split('@')[0] || "Usuário");
    }
  };

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

      // Only count completed analyses for stats
      const completedAnalyses = analysesData.filter(a => a.status === 'completed');
      const totalAnalyses = completedAnalyses.length;
      const totalCandidates = completedAnalyses.reduce((acc, analysis) => {
        const candidates = Array.isArray(analysis.candidates) ? analysis.candidates : [];
        return acc + candidates.length;
      }, 0);

      setStats(prev => ({ ...prev, totalAnalyses, totalCandidates }));
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobPostings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*, form_template:form_templates(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const postings = data || [];
      setJobPostings(postings);

      // Fetch applications count for each posting
      const activeJobs = postings.filter(p => p.status === 'active').length;
      
      // Get total applications across all jobs
      const { count } = await supabase
        .from("job_applications")
        .select("*", { count: 'exact', head: true })
        .in("job_posting_id", postings.map(p => p.id));

      setStats(prev => ({ ...prev, activeJobs, totalApplications: count || 0 }));
    } catch (error) {
      console.error("Error fetching job postings:", error);
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      paused: 'bg-amber-100 text-amber-700',
      closed: 'bg-muted text-muted-foreground',
      draft: 'bg-muted text-muted-foreground',
    };
    const labels: Record<string, string> = {
      active: 'Ativa',
      paused: 'Pausada',
      closed: 'Encerrada',
      draft: 'Rascunho',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

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
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={onNewAnalysis}
            className="btn-primary text-sm sm:text-base py-2.5 sm:py-3"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Nova Análise
          </button>
          <button
            onClick={onNewJobPosting}
            className="inline-flex items-center gap-2 px-4 sm:px-6 rounded-xl font-medium transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm sm:text-base py-2.5 sm:py-3"
          >
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            Nova Vaga
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
        <div className="card-clean p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalAnalyses}</p>
              <p className="text-xs sm:text-base text-muted-foreground truncate">Análises</p>
            </div>
          </div>
        </div>
        <div className="card-clean p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalCandidates}</p>
              <p className="text-xs sm:text-base text-muted-foreground truncate">CVs analisados</p>
            </div>
          </div>
        </div>
        <div className="card-clean p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.activeJobs}</p>
              <p className="text-xs sm:text-base text-muted-foreground truncate">Vagas ativas</p>
            </div>
          </div>
        </div>
        <div className="card-clean p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-violet-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 sm:w-7 sm:h-7 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalApplications}</p>
              <p className="text-xs sm:text-base text-muted-foreground truncate">Candidaturas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Postings Section */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            Vagas Recentes
          </h2>
          <button 
            onClick={onNavigateToJobs}
            className="text-xs sm:text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
          >
            Ver todas <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card-clean animate-pulse p-4 sm:p-6">
                <div className="h-4 sm:h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 sm:h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : jobPostings.length === 0 ? (
          <div className="card-clean text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">Você ainda não criou nenhuma vaga.</p>
            <button
              onClick={onNewJobPosting}
              className="btn-primary text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Criar primeira vaga
            </button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {jobPostings.slice(0, 3).map((job) => (
              <button
                key={job.id}
                onClick={() => onNavigateToJobs()}
                className="w-full card-hover text-left group p-3 sm:p-4 md:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 bg-blue-100">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-medium text-foreground truncate">
                          {job.title}
                        </h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          {formatDate(job.created_at)}
                        </span>
                        {job.location && (
                          <span className="truncate">{job.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-12">
        <button
          onClick={onNavigateToForms}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          Configurar Formulários
        </button>
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
              const isDraft = analysis.status === 'draft';
              
              return (
                <button
                  key={analysis.id}
                  onClick={() => isDraft ? onContinueDraft(analysis.id) : onViewAnalysis(analysis.id)}
                  className="w-full card-hover text-left group p-3 sm:p-4 md:p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${isDraft ? 'bg-amber-100' : 'bg-primary/10'}`}>
                        {isDraft ? (
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                        ) : (
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-medium text-foreground truncate">
                            {getAnalysisTitle(analysis)}
                          </h3>
                          {isDraft && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                              Rascunho
                            </span>
                          )}
                        </div>
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
