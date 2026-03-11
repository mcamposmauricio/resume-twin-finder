import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Eye, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { JobApplication, TriageStatus, TRIAGE_STATUS_LABELS } from '@/types/jobs';
import { cn } from '@/lib/utils';

interface ApplicationCardProps {
  application: JobApplication;
  onViewDetails: () => void;
  onViewResume: () => void;
  onDelete?: () => void;
  showTriageIndicator?: boolean;
  stageColor?: string;
}

export function ApplicationCard({
  application,
  onViewDetails,
  onViewResume,
  onDelete,
  showTriageIndicator = false,
  stageColor,
}: ApplicationCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasResume = !!application.resume_url;
  const isDeservesAnalysis = application.triage_status === 'deserves_analysis';

  return (
    <>
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
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir candidatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a candidatura de{' '}
              <strong>{application.applicant_name || application.applicant_email}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.();
                setShowDeleteConfirm(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
