import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Eye, Star, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobApplication, TriageStatus, TRIAGE_STATUS_LABELS } from '@/types/jobs';
import { cn } from '@/lib/utils';

interface ApplicationCardProps {
  application: JobApplication;
  onViewDetails: () => void;
  onViewResume: () => void;
  showTriageIndicator?: boolean;
  stageColor?: string;
}

export function ApplicationCard({
  application,
  onViewDetails,
  onViewResume,
  showTriageIndicator = false,
  stageColor,
}: ApplicationCardProps) {
  const hasResume = !!application.resume_url;
  const isDeservesAnalysis = application.triage_status === 'deserves_analysis';

  return (
    <div
      className={cn(
        'group p-3 bg-card border rounded-lg hover:shadow-md transition-all cursor-pointer',
        isDeservesAnalysis && 'ring-2 ring-primary/30 bg-primary/5'
      )}
      onClick={onViewDetails}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-sm">
              {application.applicant_name || 'Candidato'}
            </span>
            {isDeservesAnalysis && (
              <Star className="h-3 w-3 text-primary fill-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {application.applicant_email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(application.created_at), "dd/MM 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasResume && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onViewResume();
              }}
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
