import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Briefcase,
  Target,
  Zap,
  Check,
  Grid3X3,
  FileText,
  User,
  ArrowLeft,
  RefreshCw,
  Download,
} from "lucide-react";
import { AnalysisResult, CandidateResult } from "@/types";
import { NineBoxChart } from "./NineBoxChart";
import { Button } from "./ui/button";
import { jsPDF } from "jspdf";

interface ResultsSectionProps {
  results: AnalysisResult;
  tokensUsed: number;
  onNewAnalysis: () => void;
  onBack?: () => void;
}

// Score badge component
function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span className={`${getColor(score)} text-white font-medium rounded-full ${sizeClasses[size]}`}>
      {score}% Match
    </span>
  );
}

// Soft skill item with score bar
function SoftSkillItem({ name, score, description }: { name: string; score: number | null; description?: string }) {
  const isNA = score === null || score === undefined;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className={`text-sm font-semibold ${isNA ? 'text-muted-foreground' : 'text-foreground'}`}>
          {isNA ? 'N/A' : score}
        </span>
      </div>
      {!isNA && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      )}
    </div>
  );
}

// Cultural fit card
function CulturalFitCard({ culturalFit }: { culturalFit: CandidateResult['cultural_fit'] }) {
  const getFitType = () => {
    const scores = [
      culturalFit.results_orientation,
      culturalFit.process_orientation,
      culturalFit.people_orientation,
      culturalFit.innovation_orientation
    ];
    const maxScore = Math.max(...scores);
    
    if (culturalFit.results_orientation === maxScore) return "RESULTADOS";
    if (culturalFit.process_orientation === maxScore) return "PROCESSOS";
    if (culturalFit.people_orientation === maxScore) return "PESSOAS";
    return "INOVAÇÃO";
  };

  const avgScore = Math.round(
    (culturalFit.results_orientation + 
     culturalFit.process_orientation + 
     culturalFit.people_orientation + 
     culturalFit.innovation_orientation) / 4
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Fit Cultural</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-4xl font-bold text-blue-600">{avgScore}</span>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded uppercase">
          {getFitType()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Análise de fit cultural baseada nas orientações do candidato.
      </p>
    </div>
  );
}

// Gap Analysis table
function GapAnalysisTable({ gapAnalysis }: { gapAnalysis: CandidateResult['gap_analysis'] }) {
  const allSkills = [
    ...gapAnalysis.strong_match.map(s => ({ skill: s, level: 'Strong', impact: 'Baixo' })),
    ...gapAnalysis.moderate_match.map(s => ({ skill: s, level: 'Medium', impact: 'Médio' })),
    ...gapAnalysis.weak_or_missing.map(s => ({ skill: s, level: 'Weak', impact: 'Alto' })),
  ].slice(0, 4);

  const getLevelBadge = (level: string) => {
    const colors = {
      Strong: 'bg-green-100 text-green-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Weak: 'bg-red-100 text-red-700',
    };
    return colors[level as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      Baixo: 'bg-green-100 text-green-700',
      Médio: 'bg-yellow-100 text-yellow-700',
      Alto: 'bg-red-100 text-red-700',
    };
    return colors[impact as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Gap Analysis (Técnico)</span>
      </div>
      
      <div className="space-y-1">
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground uppercase pb-2 border-b border-border">
          <span>Skill</span>
          <span>Nível</span>
          <span>Impacto</span>
        </div>
        {allSkills.map((item, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 py-2 text-sm">
            <span className="text-foreground">{item.skill}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium w-fit ${getLevelBadge(item.level)}`}>
              {item.level}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium w-fit ${getImpactBadge(item.impact)}`}>
              {item.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Red flags section
function RedFlagsSection({ redFlags }: { redFlags: string[] }) {
  const hasFlags = redFlags.length > 0;
  
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className={`w-4 h-4 ${hasFlags ? 'text-red-500' : 'text-green-500'}`} />
        <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">Red Flags (Riscos)</span>
      </div>
      
      {hasFlags ? (
        <ul className="space-y-2">
          {redFlags.map((flag, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 text-green-600">
          <Check className="w-4 h-4" />
          <span className="text-sm">Nenhum risco crítico identificado.</span>
        </div>
      )}
    </div>
  );
}

// Individual candidate card
function CandidateCard({ candidate, rank }: { candidate: CandidateResult; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);

  // Parse soft skills into grid format
  const softSkillsGrid = candidate.soft_skills.slice(0, 8);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {candidate.candidate_name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {candidate.years_experience} anos exp.
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {candidate.inferred_info?.seniority_level || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {candidate.match_score}%
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Match Geral</p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-6 space-y-6">
          {/* Info Cards Row */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Inteligência de Dados
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Pretensão (Est.)</p>
                <p className="text-sm font-medium text-foreground">
                  {candidate.inferred_info?.estimated_salary_range || 'Sem dados'}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Tenure Médio</p>
                <p className="text-sm font-medium text-foreground">
                  {candidate.inferred_info?.availability || 'N/A'}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Modelo Ideal</p>
                <p className="text-sm font-medium text-foreground">
                  {candidate.inferred_info?.remote_work_compatibility || 'Sem dados'}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Senioridade Real</p>
                <p className="text-sm font-medium text-foreground">
                  {candidate.inferred_info?.seniority_level || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Resumo Profissional</p>
            <blockquote className="text-sm text-foreground italic border-l-2 border-muted pl-4">
              "{candidate.summary}"
            </blockquote>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Soft Skills */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Soft Skills (Comportamental)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {softSkillsGrid.map((skill) => (
                  <SoftSkillItem
                    key={skill.name}
                    name={skill.name}
                    score={skill.score}
                  />
                ))}
              </div>
            </div>

            {/* Cultural Fit */}
            <CulturalFitCard culturalFit={candidate.cultural_fit} />
          </div>

          {/* Gap Analysis and Red Flags */}
          <div className="grid grid-cols-2 gap-6">
            <GapAnalysisTable gapAnalysis={candidate.gap_analysis} />
            <RedFlagsSection redFlags={candidate.red_flags} />
          </div>

        </div>
      )}
    </div>
  );
}

// Strategic comparison table
function ComparisonTable({ candidates }: { candidates: CandidateResult[] }) {
  const getRiskLevel = (redFlags: string[]) => {
    if (redFlags.length === 0) return { label: 'Safe', color: 'text-green-600' };
    if (redFlags.length <= 2) return { label: `${redFlags.length}`, color: 'text-yellow-600', icon: true };
    return { label: `${redFlags.length}`, color: 'text-red-600', icon: true };
  };

  const getCulturalType = (culturalFit: CandidateResult['cultural_fit']) => {
    const scores = {
      results: culturalFit.results_orientation,
      process: culturalFit.process_orientation,
      people: culturalFit.people_orientation,
      innovation: culturalFit.innovation_orientation
    };
    const maxKey = Object.keys(scores).reduce((a, b) => 
      scores[a as keyof typeof scores] > scores[b as keyof typeof scores] ? a : b
    );
    const avgScore = Math.round(
      (scores.results + scores.process + scores.people + scores.innovation) / 4
    );
    
    const labels = {
      results: 'RESULTADOS',
      process: 'PROCESSOS',
      people: 'PESSOAS',
      innovation: 'INOVAÇÃO'
    };
    
    return { score: avgScore, type: labels[maxKey as keyof typeof labels] };
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Comparativo Estratégico</h3>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Candidato</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tech / Soft</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fit Cultural</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Riscos</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nível Est.</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const risk = getRiskLevel(candidate.red_flags);
              const cultural = getCulturalType(candidate.cultural_fit);
              
              return (
                <tr key={candidate.candidate_name} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-foreground">{candidate.candidate_name}</span>
                  </td>
                  <td className="p-4">
                    <ScoreBadge score={candidate.match_score} size="sm" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600 font-medium">T: {candidate.technical_fit}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-purple-600 font-medium">S: {candidate.potential_fit}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">{cultural.score}%</span>
                      <span className="text-muted-foreground ml-1 text-xs">{cultural.type}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 text-sm font-medium ${risk.color}`}>
                      {risk.icon && <AlertTriangle className="w-4 h-4" />}
                      <span>{risk.label}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground">
                      {candidate.inferred_info?.seniority_level || 'N/A'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResultsSection({
  results,
  tokensUsed,
  onNewAnalysis,
  onBack,
}: ResultsSectionProps) {
  const sortedCandidates = [...results.candidates].sort(
    (a, b) => b.match_score - a.match_score
  );
  
  const recommendedCandidates = sortedCandidates.filter(c => c.match_score >= 50);
  const notRecommendedCandidates = sortedCandidates.filter(c => c.match_score < 50);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    const lineHeight = 7;
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    const addText = (text: string, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
    };

    const addSection = (title: string) => {
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      addText(title, 14, true);
      y += 3;
    };

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CompareCV powered by MarQ - Relatório", margin, 23);
    doc.setTextColor(0, 0, 0);
    y = 45;

    // Summary
    addSection("Resumo da Análise");
    addText(`Total de candidatos analisados: ${sortedCandidates.length}`);
    addText(`Candidatos recomendados (≥50%): ${recommendedCandidates.length}`);
    addText(`Candidatos não recomendados (<50%): ${notRecommendedCandidates.length}`);
    
    if (results.recommendation) {
      y += 3;
      addText(`Recomendação: ${results.recommendation}`);
    }

    // Ranking
    addSection("Ranking de Candidatos");
    sortedCandidates.forEach((candidate, index) => {
      const status = candidate.match_score >= 50 ? "✓" : "✗";
      addText(`${index + 1}. ${candidate.candidate_name} - ${candidate.match_score}% ${status}`);
    });

    // Detailed analysis for recommended candidates
    if (recommendedCandidates.length > 0) {
      addSection("Análise Detalhada - Candidatos Recomendados");
      
      recommendedCandidates.forEach((candidate, index) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        y += 5;
        addText(`${index + 1}. ${candidate.candidate_name}`, 12, true);
        addText(`Match Score: ${candidate.match_score}% | Tech Fit: ${candidate.technical_fit}% | Potential: ${candidate.potential_fit}%`);
        addText(`Experiência: ${candidate.years_experience} anos | ${candidate.inferred_info?.seniority_level || "N/A"}`);
        addText(`Resumo: ${candidate.summary}`);
        
        if (candidate.soft_skills?.length > 0) {
          addText(`Soft Skills: ${candidate.soft_skills.map(s => `${s.name} (${s.score}%)`).join(", ")}`);
        }
        
        if (candidate.red_flags?.length > 0) {
          addText(`Red Flags: ${candidate.red_flags.join("; ")}`);
        }
        
        y += 3;
      });
    }

    // Not recommended list
    if (notRecommendedCandidates.length > 0) {
      addSection("Candidatos Não Recomendados");
      notRecommendedCandidates.forEach((candidate) => {
        addText(`• ${candidate.candidate_name} - ${candidate.match_score}% (${candidate.inferred_info?.seniority_level || "N/A"})`);
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`CompareCV powered by MarQ | Página ${i} de ${totalPages}`, margin, 290);
    }

    doc.save(`comparecv-relatorio-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onNewAnalysis} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Nova Análise
          </Button>
          <Button onClick={generatePDF} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Baixar Relatório
          </Button>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">Resumo da Análise</h2>
        </div>
        <p className="text-foreground">
          Para esta análise foram avaliados <span className="font-semibold text-blue-600">{sortedCandidates.length} currículos</span>, 
          sendo <span className="font-semibold text-green-600">{recommendedCandidates.length} na zona de recomendação</span> (match ≥ 50%) 
          e <span className="font-semibold text-red-600">{notRecommendedCandidates.length} fora da recomendação</span> (match &lt; 50%).
        </p>
      </div>

      {/* Nine Box Chart */}
      <NineBoxChart candidates={sortedCandidates} />

      {/* Comparison Table */}
      <ComparisonTable candidates={sortedCandidates} />

      {/* Recommended Candidates - Individual Analysis */}
      {recommendedCandidates.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Análise Individual Aprofundada</h2>
          </div>

          <div className="space-y-4">
            {recommendedCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.candidate_name}
                candidate={candidate}
                rank={index + 1}
              />
            ))}
          </div>
        </>
      )}

      {/* Not Recommended Candidates */}
      {notRecommendedCandidates.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-foreground">Candidatos Não Recomendados</h2>
            <span className="text-sm text-muted-foreground">(Match abaixo de 50%)</span>
          </div>
          <div className="space-y-3">
            {notRecommendedCandidates.map((candidate) => (
              <div
                key={candidate.candidate_name}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{candidate.candidate_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {candidate.years_experience} anos exp. • {candidate.inferred_info?.seniority_level || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-red-100 text-red-600 font-medium rounded-full text-sm">
                    {candidate.match_score}% Match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center pt-4 text-sm text-muted-foreground">
        <span>Tokens utilizados: {tokensUsed.toLocaleString()}</span>
      </div>
    </div>
  );
}
