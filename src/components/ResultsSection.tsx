import { useState } from "react";
import {
  Trophy,
  User,
  Briefcase,
  Brain,
  AlertTriangle,
  Target,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Award,
  Globe,
  GraduationCap,
  Wrench,
  Clock,
  DollarSign,
  Users,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { AnalysisResult, CandidateResult } from "@/types";
import { NineBoxChart } from "./NineBoxChart";

interface ResultsSectionProps {
  results: AnalysisResult;
  tokensUsed: number;
  onNewAnalysis: () => void;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{score}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  rank,
}: {
  candidate: CandidateResult;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const getRankColor = (r: number) => {
    if (r === 1) return "bg-yellow-500";
    if (r === 2) return "bg-slate-400";
    if (r === 3) return "bg-amber-600";
    return "bg-slate-300";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 ${getRankColor(rank)} rounded-full flex items-center justify-center text-white font-bold text-lg`}
            >
              {rank}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {candidate.candidate_name}
              </h3>
              <p className="text-sm text-slate-500">{candidate.file_name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {candidate.match_score}%
            </div>
            <p className="text-sm text-slate-500">Match Score</p>
          </div>
        </div>

        {/* Main Scores */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <ScoreBar score={candidate.technical_fit} label="Technical Fit" />
          <ScoreBar score={candidate.potential_fit} label="Potential Fit" />
        </div>

        {/* Summary */}
        <p className="text-slate-600">{candidate.summary}</p>
        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
          <Briefcase className="w-4 h-4" />
          <span>{candidate.years_experience} anos de experiência</span>
        </div>
      </div>

      {/* Expandable Content */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center justify-center gap-2 text-blue-600 hover:bg-slate-50 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span>Ver menos</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span>Ver análise completa</span>
            </>
          )}
        </button>

        {expanded && (
          <div className="p-6 pt-0 space-y-6">
            {/* Soft Skills */}
            <div>
              <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <Brain className="w-5 h-5 text-blue-500" />
                Soft Skills
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {candidate.soft_skills.map((skill) => (
                  <ScoreBar
                    key={skill.name}
                    score={skill.score}
                    label={skill.name}
                  />
                ))}
              </div>
            </div>

            {/* Cultural Fit */}
            <div>
              <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <Users className="w-5 h-5 text-purple-500" />
                Cultural Fit
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <ScoreBar
                  score={candidate.cultural_fit.results_orientation}
                  label="Orientação a Resultados"
                />
                <ScoreBar
                  score={candidate.cultural_fit.process_orientation}
                  label="Orientação a Processos"
                />
                <ScoreBar
                  score={candidate.cultural_fit.people_orientation}
                  label="Orientação a Pessoas"
                />
                <ScoreBar
                  score={candidate.cultural_fit.innovation_orientation}
                  label="Orientação à Inovação"
                />
              </div>
            </div>

            {/* Red Flags */}
            {candidate.red_flags.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Red Flags
                </h4>
                <ul className="space-y-2">
                  {candidate.red_flags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gap Analysis */}
            <div>
              <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <Target className="w-5 h-5 text-green-500" />
                Gap Analysis
              </h4>
              <div className="space-y-3">
                {candidate.gap_analysis.strong_match.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">
                      Strong Match
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.gap_analysis.strong_match.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {candidate.gap_analysis.moderate_match.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-yellow-700 mb-1">
                      Moderate Match
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.gap_analysis.moderate_match.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {candidate.gap_analysis.weak_or_missing.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">
                      Weak/Missing
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.gap_analysis.weak_or_missing.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inferred Info */}
            <div>
              <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <Star className="w-5 h-5 text-amber-500" />
                Informações Inferidas
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Senioridade:</span>
                  <span className="font-medium">
                    {candidate.inferred_info.seniority_level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Faixa Salarial:</span>
                  <span className="font-medium">
                    {candidate.inferred_info.estimated_salary_range}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Educação:</span>
                  <span className="font-medium">
                    {candidate.inferred_info.education_level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Idiomas:</span>
                  <span className="font-medium">
                    {candidate.inferred_info.languages.join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Liderança:</span>
                  <span className="font-medium">
                    {candidate.inferred_info.leadership_experience}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Remoto:</span>
                  <span className="font-medium">
                    {candidate.inferred_info.remote_work_compatibility}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Disponibilidade:</span>
                  <span className="font-medium">
                    {candidate.inferred_info.availability}
                  </span>
                </div>
              </div>

              {/* Tools */}
              {candidate.inferred_info.tools_and_technologies.length > 0 && (
                <div className="mt-3">
                  <p className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Wrench className="w-4 h-4" />
                    Ferramentas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.inferred_info.tools_and_technologies.map(
                      (tool) => (
                        <span
                          key={tool}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                          {tool}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {candidate.inferred_info.certifications.length > 0 && (
                <div className="mt-3">
                  <p className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Award className="w-4 h-4" />
                    Certificações:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.inferred_info.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ResultsSection({
  results,
  tokensUsed,
  onNewAnalysis,
}: ResultsSectionProps) {
  // Sort candidates by match_score
  const sortedCandidates = [...results.candidates].sort(
    (a, b) => b.match_score - a.match_score
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Recommendation */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Recomendação da IA</h2>
            <p className="text-blue-100 text-lg">{results.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Resumo Comparativo
        </h3>
        <p className="text-slate-600">{results.comparison_summary}</p>
      </div>

      {/* Nine Box Chart */}
      <div className="mb-8">
        <NineBoxChart candidates={sortedCandidates} />
      </div>

      {/* Candidate Cards */}
      <h3 className="text-2xl font-bold text-slate-800 mb-6">
        Análise Individual
      </h3>
      <div className="space-y-6 mb-8">
        {sortedCandidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.candidate_name}
            candidate={candidate}
            rank={index + 1}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl">
        <p className="text-sm text-slate-500">
          Tokens utilizados: {tokensUsed.toLocaleString()}
        </p>
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Nova Análise
        </button>
      </div>
    </div>
  );
}
