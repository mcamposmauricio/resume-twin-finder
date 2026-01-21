import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Star, Inbox, ThumbsDown } from 'lucide-react';
import { JobApplication, TriageStatus, TRIAGE_STATUS_LABELS } from '@/types/jobs';

interface SendToAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: JobApplication[];
  balance: number;
  onConfirm: (applicationIds: string[]) => Promise<void>;
}

const TRIAGE_ORDER: TriageStatus[] = ['deserves_analysis', 'new', 'low_fit'];
const TRIAGE_ICONS: Record<TriageStatus, React.ElementType> = {
  new: Inbox,
  low_fit: ThumbsDown,
  deserves_analysis: Star,
};
const TRIAGE_COLORS: Record<TriageStatus, string> = {
  new: 'text-muted-foreground',
  low_fit: 'text-orange-600',
  deserves_analysis: 'text-primary',
};

export function SendToAnalysisDialog({
  open,
  onOpenChange,
  applications,
  balance,
  onConfirm,
}: SendToAnalysisDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const eligibleApplications = applications.filter(
    (a) => a.resume_url && !a.analysis_id
  );
  const alreadyAnalyzed = applications.filter((a) => a.analysis_id);

  // Group by triage status
  const groupedApplications = useMemo(() => {
    const groups: Record<TriageStatus, JobApplication[]> = {
      deserves_analysis: [],
      new: [],
      low_fit: [],
    };

    eligibleApplications.forEach((app) => {
      const status = app.triage_status || 'new';
      if (groups[status]) {
        groups[status].push(app);
      } else {
        groups.new.push(app);
      }
    });

    return groups;
  }, [eligibleApplications]);

  // Pre-select "deserves_analysis" when dialog opens
  useEffect(() => {
    if (open) {
      const deservesAnalysis = eligibleApplications
        .filter((app) => app.triage_status === 'deserves_analysis')
        .map((app) => app.id);
      setSelectedIds(deservesAnalysis);
    }
  }, [open]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleGroupSelection = (status: TriageStatus) => {
    const groupIds = groupedApplications[status].map((a) => a.id);
    const allSelected = groupIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedIds([...new Set([...selectedIds, ...groupIds])]);
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await onConfirm(selectedIds);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = selectedIds.length > 0 && selectedIds.length <= balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Enviar Candidatos para Análise</DialogTitle>
          <DialogDescription>
            Candidatos marcados como "Merece análise" já vêm pré-selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {eligibleApplications.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Não há candidatos elegíveis para análise.</p>
              <p className="text-sm">
                Candidatos precisam ter currículo anexado e não terem sido
                analisados anteriormente.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {TRIAGE_ORDER.map((status) => {
                const apps = groupedApplications[status];
                if (apps.length === 0) return null;

                const Icon = TRIAGE_ICONS[status];
                const groupIds = apps.map((a) => a.id);
                const allSelected = groupIds.every((id) =>
                  selectedIds.includes(id)
                );
                const someSelected =
                  groupIds.some((id) => selectedIds.includes(id)) && !allSelected;

                return (
                  <div key={status} className="space-y-2">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2"
                      onClick={() => toggleGroupSelection(status)}
                    >
                      <Checkbox
                        checked={allSelected}
                        className={someSelected ? 'opacity-50' : ''}
                        onCheckedChange={() => toggleGroupSelection(status)}
                      />
                      <Icon className={`h-4 w-4 ${TRIAGE_COLORS[status]}`} />
                      <span className="font-medium text-sm">
                        {TRIAGE_STATUS_LABELS[status]}
                      </span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {apps.length}
                      </Badge>
                    </div>

                    <div className="space-y-1 pl-6">
                      {apps.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleSelection(app.id)}
                        >
                          <Checkbox
                            checked={selectedIds.includes(app.id)}
                            onCheckedChange={() => toggleSelection(app.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {app.applicant_name || 'Candidato'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {app.applicant_email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {alreadyAnalyzed.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm text-muted-foreground">Já analisados:</p>
              {alreadyAnalyzed.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg opacity-60"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {app.applicant_name || 'Candidato'}
                    </p>
                  </div>
                  <Badge variant="secondary">Analisado</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Selecionados: </span>
              <span className="font-medium">{selectedIds.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Saldo disponível: </span>
              <span className="font-medium">{balance}</span>
            </div>
          </div>

          {selectedIds.length > balance && (
            <p className="text-sm text-destructive">
              Você selecionou mais candidatos do que seu saldo permite.
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!canAnalyze || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Iniciar Análise ({selectedIds.length})
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
