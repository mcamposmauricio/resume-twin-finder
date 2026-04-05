import { Briefcase, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TalentApplication } from '@/hooks/useTalentPool';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TRIAGE_LABELS: Record<string, string> = {
  new: 'Nova',
  low_fit: 'Baixa aderência',
  deserves_analysis: 'Merece análise',
};

const TRIAGE_STYLES: Record<string, string> = {
  new: 'bg-muted text-muted-foreground',
  low_fit: 'bg-red-100 text-red-700',
  deserves_analysis: 'bg-emerald-100 text-emerald-700',
};

interface Props {
  applications: TalentApplication[];
  bestTriageId?: string;
}

export function TalentTimeline({ applications, bestTriageId }: Props) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-4">
        {applications.map((app, idx) => {
          const isBest = app.id === bestTriageId;
          return (
            <div key={app.id} className="relative">
              {/* Dot */}
              <div className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                isBest 
                  ? 'bg-primary border-primary' 
                  : idx === 0 
                    ? 'bg-card border-primary'
                    : 'bg-card border-border'
              }`}>
                {isBest ? (
                  <Star className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <Briefcase className={`w-3 h-3 ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </div>

              <div className={`p-3 rounded-lg border ${isBest ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{app.job_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(app.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isBest && (
                      <Badge variant="outline" className="text-[10px] border-primary text-primary">
                        Melhor
                      </Badge>
                    )}
                    <Badge variant="secondary" className={`text-[10px] ${TRIAGE_STYLES[app.triage_status] || ''}`}>
                      {TRIAGE_LABELS[app.triage_status] || app.triage_status}
                    </Badge>
                  </div>
                </div>
                {app.resume_url && (
                  <a
                    href={app.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver currículo
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
