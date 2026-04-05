import { User, Mail, Briefcase, Calendar, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TalentProfile } from '@/hooks/useTalentPool';
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

interface TalentCardProps {
  talent: TalentProfile;
  onClick: () => void;
}

export function TalentCard({ talent, onClick }: TalentCardProps) {
  const latestDate = format(new Date(talent.latestApplication.created_at), "dd MMM yyyy", { locale: ptBR });
  const latestTriage = talent.latestApplication.triage_status;

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
              <h3 className="font-semibold text-foreground truncate">{talent.name}</h3>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                {talent.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {talent.totalApplications} {talent.totalApplications === 1 ? 'vaga' : 'vagas'}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {latestDate}
                </span>
                {talent.latestResumeUrl && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    CV
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                Última: {talent.latestApplication.job_title}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={`text-xs flex-shrink-0 ${TRIAGE_STYLES[latestTriage] || ''}`}>
            {TRIAGE_LABELS[latestTriage] || latestTriage}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
