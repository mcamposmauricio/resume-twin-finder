import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Mail, ExternalLink, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobApplication, APPLICATION_STATUS_LABELS } from '@/types/jobs';

interface ApplicationListProps {
  applications: JobApplication[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onViewResume: (application: JobApplication) => void;
  onViewDetails: (application: JobApplication) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shortlisted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  analyzed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function ApplicationList({
  applications,
  selectedIds,
  onSelectionChange,
  onViewResume,
  onViewDetails,
}: ApplicationListProps) {
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(applications.map((a) => a.id));
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma candidatura recebida ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Checkbox
          checked={selectedIds.length === applications.length && applications.length > 0}
          onCheckedChange={toggleSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} selecionados`
            : 'Selecionar todos'}
        </span>
      </div>

      <div className="space-y-2">
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selectedIds.includes(app.id)}
              onCheckedChange={() => toggleSelection(app.id)}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {app.applicant_name || 'Candidato'}
                </span>
                <Badge className={STATUS_COLORS[app.status]}>
                  {APPLICATION_STATUS_LABELS[app.status]}
                </Badge>
                {app.analysis_id && (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Analisado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {app.applicant_email && (
                  <span className="truncate">{app.applicant_email}</span>
                )}
                <span>
                  {format(new Date(app.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {app.resume_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewResume(app)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Currículo
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(app)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Detalhes
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
