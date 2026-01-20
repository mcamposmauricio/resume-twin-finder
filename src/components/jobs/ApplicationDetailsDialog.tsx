import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { JobApplication, FormField, APPLICATION_STATUS_LABELS } from '@/types/jobs';

interface ApplicationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication | null;
  formFields: FormField[];
}

export function ApplicationDetailsDialog({
  open,
  onOpenChange,
  application,
  formFields,
}: ApplicationDetailsDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Candidatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {application.applicant_name || 'Candidato'}
              </h3>
              <Badge>
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
            </div>
            {application.applicant_email && (
              <p className="text-muted-foreground">{application.applicant_email}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Aplicou em{' '}
              {format(new Date(application.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Respostas do Formulário</h4>
            {Object.entries(application.form_data || {}).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma resposta registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(application.form_data || {}).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {getFieldLabel(key)}
                    </p>
                    <p className="text-sm">{formatValue(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {application.resume_filename && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Currículo</h4>
                <p className="text-sm text-muted-foreground">
                  {application.resume_filename}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
