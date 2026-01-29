import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, User, TrendingUp, Clock, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Candidate {
  candidate_name: string;
  file_name: string;
  match_score: number;
  technical_fit: number;
  potential_fit: number;
  summary: string;
  years_experience: number;
  red_flags?: string[];
}

interface AnalysisData {
  id: string;
  job_title: string | null;
  job_description: string;
  created_at: string;
  duration_seconds: number | null;
  tokens_used: number | null;
  results: {
    recommendation?: string;
    comparison_summary?: string;
    candidates_analysis?: Candidate[];
  } | null;
}

interface AnalysisPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string | null;
  userEmail?: string;
}

export function AnalysisPreviewDialog({
  open,
  onOpenChange,
  analysisId,
  userEmail,
}: AnalysisPreviewDialogProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    if (open && analysisId) {
      fetchAnalysis();
    }
  }, [open, analysisId]);

  const fetchAnalysis = async () => {
    if (!analysisId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", analysisId)
        .maybeSingle();

      if (error) throw error;
      setAnalysis(data as AnalysisData);
    } catch (err) {
      console.error("Error fetching analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCandidates = (): Candidate[] => {
    if (!analysis?.results) return [];
    const results = analysis.results as any;
    return results.candidates_analysis || results.candidates || [];
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const candidates = getCandidates();
  const recommendedCandidates = candidates.filter(c => c.match_score >= 50);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview de Análise
          </DialogTitle>
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              Realizada por: {userEmail}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-80px)]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse text-muted-foreground">
                Carregando análise...
              </div>
            </div>
          ) : !analysis ? (
            <div className="p-8 text-center text-muted-foreground">
              Análise não encontrada
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Vaga</p>
                  <p className="font-medium text-sm truncate">
                    {analysis.job_title || "Não especificada"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Candidatos</p>
                  <p className="font-medium text-sm">{candidates.length}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium text-sm">
                    {format(new Date(analysis.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-medium text-sm">
                    {analysis.duration_seconds 
                      ? `${Math.floor(analysis.duration_seconds / 60)}m ${analysis.duration_seconds % 60}s`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              {analysis.results?.recommendation && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-primary mb-1">
                    Recomendação da IA
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.results.recommendation}
                  </p>
                </div>
              )}

              <Separator />

              {/* Candidates Table */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Candidatos Analisados
                </h3>
                
                <div className="space-y-3">
                  {candidates.map((candidate, idx) => (
                    <div 
                      key={idx}
                      className={`border rounded-lg p-4 ${
                        candidate.match_score >= 50 
                          ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {candidate.candidate_name || "Candidato não identificado"}
                            </p>
                            {candidate.match_score >= 50 && (
                              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {candidate.file_name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-2xl font-bold ${getScoreColor(candidate.match_score)}`}>
                            {Math.round(candidate.match_score)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Match</p>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Fit Técnico</span>
                            <span className="font-medium">{Math.round(candidate.technical_fit)}%</span>
                          </div>
                          <Progress 
                            value={candidate.technical_fit} 
                            className="h-1.5"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Potencial</span>
                            <span className="font-medium">{Math.round(candidate.potential_fit)}%</span>
                          </div>
                          <Progress 
                            value={candidate.potential_fit} 
                            className="h-1.5"
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      {candidate.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {candidate.summary}
                        </p>
                      )}

                      {/* Red Flags */}
                      {candidate.red_flags && candidate.red_flags.length > 0 && (
                        <div className="mt-2 flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-700 dark:text-yellow-500">
                            {candidate.red_flags.length} ponto{candidate.red_flags.length > 1 ? "s" : ""} de atenção
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {recommendedCandidates.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recomendados (≥50%)
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {candidates.length > 0 
                        ? Math.round(candidates.reduce((sum, c) => sum + c.match_score, 0) / candidates.length)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Média de Match
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {analysis.tokens_used?.toLocaleString() || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tokens Usados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
