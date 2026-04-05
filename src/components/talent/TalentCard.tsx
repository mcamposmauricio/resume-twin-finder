import { User, Mail, Phone, Briefcase, Calendar, FileText, Flame, Thermometer, Snowflake, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TalentPoolRow } from '@/hooks/useTalentPool';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TRIAGE_STYLES: Record<string, string> = {
  new: 'bg-muted text-muted-foreground',
  low_fit: 'bg-red-100 text-red-700',
  deserves_analysis: 'bg-emerald-100 text-emerald-700',
};

const TRIAGE_LABELS: Record<string, string> = {
  new: 'Nova',
  low_fit: 'Baixa aderência',
  deserves_analysis: 'Merece análise',
};

function getScoreBadge(score: number) {
  if (score > 70) return { label: 'Quente', icon: Flame, className: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (score >= 40) return { label: 'Morno', icon: Thermometer, className: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Frio', icon: Snowflake, className: 'bg-sky-100 text-sky-700 border-sky-200' };
}

function getRecencyBadge(latestDate: string) {
  const diff = (Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 7) return { label: 'Novo', className: 'bg-green-100 text-green-700' };
  if (diff <= 30) return { label: 'Ativo', className: 'bg-blue-100 text-blue-700' };
  return null;
}

interface TalentCardProps {
  talent: TalentPoolRow;
  onClick: () => void;
}

export function TalentCard({ talent, onClick }: TalentCardProps) {
  const latestDate = format(new Date(talent.latest_date), "dd MMM yyyy", { locale: ptBR });
  const scoreBadge = getScoreBadge(talent.score);
  const ScoreIcon = scoreBadge.icon;
  const recency = getRecencyBadge(talent.latest_date);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-border"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{talent.name}</h3>
                {recency && (
                  <Badge variant="secondary" className={`text-[10px] ${recency.className}`}>
                    {recency.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                {talent.email}
              </p>
              {talent.phone && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  {talent.phone}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {talent.total_applications} {talent.total_applications === 1 ? 'vaga' : 'vagas'}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {latestDate}
                </span>
                {talent.has_resume && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    CV
                  </span>
                )}
                {talent.total_applications > 1 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Recorrente
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                Última: {talent.latest_job_title}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge variant="outline" className={`text-xs flex items-center gap-1 ${scoreBadge.className}`}>
              <ScoreIcon className="w-3 h-3" />
              {scoreBadge.label}
            </Badge>
            <Badge variant="secondary" className={`text-xs ${TRIAGE_STYLES[talent.latest_triage] || ''}`}>
              {TRIAGE_LABELS[talent.latest_triage] || talent.latest_triage}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
