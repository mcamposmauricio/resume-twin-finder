import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
  Users,
  Calendar,
  MoreVertical,
  Eye,
  Pencil,
  Send,
  Trash2,
  FileEdit,
  CheckCircle,
  PauseCircle,
  XCircle,
  BarChart3,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobPosting, JobStatus, STATUS_LABELS, WORK_TYPE_LABELS } from '@/types/jobs';


interface JobPostingCardProps {
  job: JobPosting;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: JobStatus) => void;
  onSendToAnalysis?: () => void;
  isAnalyzedView?: boolean;
  onViewAnalysis?: () => void;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_ICONS: Record<JobStatus, React.ReactNode> = {
  draft: <FileEdit className="h-3 w-3" />,
  active: <CheckCircle className="h-3 w-3" />,
  paused: <PauseCircle className="h-3 w-3" />,
  closed: <XCircle className="h-3 w-3" />,
};

export function JobPostingCard({
  job,
  onView,
  onEdit,
  onDelete,
  onChangeStatus,
  onSendToAnalysis,
  isAnalyzedView,
  onViewAnalysis,
}: JobPostingCardProps) {
  const canEdit = job.status === 'draft' || job.status === 'paused';

  const getAvailableStatusActions = (): { status: JobStatus; label: string }[] => {
    switch (job.status) {
      case 'draft':
        return [{ status: 'active', label: 'Publicar' }];
      case 'active':
        return [
          { status: 'paused', label: 'Pausar' },
          { status: 'closed', label: 'Encerrar' },
        ];
      case 'paused':
        return [
          { status: 'active', label: 'Reativar' },
          { status: 'closed', label: 'Encerrar' },
        ];
      case 'closed':
        return [];
      default:
        return [];
    }
  };

  const statusActions = getAvailableStatusActions();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
              onClick={onView}
            >
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`${STATUS_COLORS[job.status]} flex items-center gap-1`}>
                {STATUS_ICONS[job.status]}
                {STATUS_LABELS[job.status]}
              </Badge>
              {job.work_type && (
                <Badge variant="outline">
                  {WORK_TYPE_LABELS[job.work_type]}
                </Badge>
              )}
              {job.analyzed_at && (
                <Badge variant="outline" className="text-primary border-primary">
                  Analisado
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>

              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}

              {job.status === 'closed' && (job.applications_count || 0) > 0 && !job.analyzed_at && onSendToAnalysis && (
                <DropdownMenuItem onClick={onSendToAnalysis}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Análise
                </DropdownMenuItem>
              )}

              {job.status === 'closed' && job.analyzed_at && (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <Send className="h-4 w-4 mr-2" />
                  Já analisado
                </DropdownMenuItem>
              )}

              {statusActions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {statusActions.map(({ status, label }) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onChangeStatus(status)}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {stripHtmlToText(job.description)}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{job.applications_count || 0} candidaturas</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(job.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>


        {job.status === 'active' && job.public_slug && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/vaga/${job.public_slug}`);
                toast.success('Link copiado!');
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <LinkIcon className="h-3 w-3" />
              Copiar link público
            </button>
          </div>
        )}

        {job.status === 'closed' && (job.applications_count || 0) > 0 && !job.analyzed_at && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Badge variant="outline" className="text-primary border-primary">
              <Send className="h-3 w-3 mr-1" />
              Pronto para análise
            </Badge>
          </div>
        )}

        {isAnalyzedView && job.analyzed_at && onViewAnalysis && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button 
              variant="default" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onViewAnalysis();
              }}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Ver Análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
