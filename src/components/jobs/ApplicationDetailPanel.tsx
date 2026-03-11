import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  JobApplication,
  FormField,
  APPLICATION_STATUS_LABELS,
} from '@/types/jobs';
import { PipelineStage } from '@/types/pipeline';
import { StageIcon } from './StageIcon';

interface ApplicationDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication | null;
  applications: JobApplication[];
  formFields: FormField[];
  stages: PipelineStage[];
  onNavigate: (direction: 'prev' | 'next') => void;
  onUpdateTriageStatus: (id: string, status: string) => Promise<boolean>;
  getResumeUrl: (path: string) => Promise<string | null>;
  onDelete?: () => void;
}

export function ApplicationDetailPanel({
  open,
  onOpenChange,
  application,
  applications,
  formFields,
  stages,
  onNavigate,
  onUpdateTriageStatus,
  getResumeUrl,
  onDelete,
}: ApplicationDetailPanelProps) {
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentIndex = application
    ? applications.findIndex((a) => a.id === application.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < applications.length - 1;

  useEffect(() => {
    if (application?.resume_url && open) {
      setLoadingResume(true);
      getResumeUrl(application.resume_url)
        .then((url) => setResumePreviewUrl(url))
        .finally(() => setLoadingResume(false));
    } else {
      setResumePreviewUrl(null);
    }
  }, [application?.resume_url, open, getResumeUrl]);

  if (!application) return null;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const getFieldLabel = (fieldId: string): string => {
    const field = formFields.find((f) => f.id === fieldId);
    return field?.label || fieldId;
  };

  const handleStageChange = async (stageSlug: string) => {
    setUpdatingStage(true);
    try {
      await onUpdateTriageStatus(application.id, stageSlug);
    } finally {
      setUpdatingStage(false);
    }
  };

  const currentStage = stages.find((s) => s.slug === (application.triage_status || 'new'));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div>
            <SheetTitle className="text-xl">
              {application.applicant_name || 'Candidato'}
            </SheetTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              {application.applicant_email && (
                <span>{application.applicant_email}</span>
              )}
              <Badge variant="secondary">
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Aplicou em{' '}
              {format(new Date(application.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        {/* Stage Select */}
        {stages.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Etapa do Processo</h3>
              <Select
                value={application.triage_status || 'new'}
                onValueChange={handleStageChange}
                disabled={updatingStage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {currentStage && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: currentStage.color }}
                        />
                        <span>{currentStage.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.slug}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <StageIcon icon={stage.icon} className="h-3.5 w-3.5" />
                        <span>{stage.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator className="my-6" />
          </>
        )}

        {/* Form Responses */}
        <div className="space-y-4">
          <h3 className="font-semibold">Respostas do Formulário</h3>
          <div className="grid gap-3">
            {Object.entries(application.form_data || {}).map(([key, value]) => (
              <div key={key} className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">
                  {getFieldLabel(key)}
                </p>
                <p className="mt-1 break-words overflow-hidden">{formatValue(value)}</p>
              </div>
            ))}
            {Object.keys(application.form_data || {}).length === 0 && (
              <p className="text-muted-foreground text-sm">
                Nenhuma resposta registrada.
              </p>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Resume Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Currículo</h3>
            {resumePreviewUrl && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(resumePreviewUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={resumePreviewUrl} download={application.resume_filename}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </a>
                </Button>
              </div>
            )}
          </div>

          {loadingResume && (
            <div className="h-[500px] flex items-center justify-center bg-muted/30 rounded-lg border">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {!loadingResume && resumePreviewUrl && (
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <iframe
                src={`${resumePreviewUrl}#toolbar=0`}
                className="w-full h-[500px]"
                title="Prévia do currículo"
              />
            </div>
          )}

          {!loadingResume && !application.resume_url && (
            <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg border text-muted-foreground">
              Nenhum currículo anexado
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onNavigate('prev')}
            disabled={!hasPrev}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} de {applications.length}
          </span>
          <Button
            variant="outline"
            onClick={() => onNavigate('next')}
            disabled={!hasNext}
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
