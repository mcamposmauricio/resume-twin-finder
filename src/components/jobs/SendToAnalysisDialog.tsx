import { useState } from 'react';
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
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { JobApplication } from '@/types/jobs';

interface SendToAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: JobApplication[];
  balance: number;
  onConfirm: (applicationIds: string[]) => Promise<void>;
}

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

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Candidatos para Análise</DialogTitle>
          <DialogDescription>
            Selecione os candidatos que deseja analisar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {eligibleApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.includes(app.id)}
                    onCheckedChange={() => toggleSelection(app.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {app.applicant_name || 'Candidato'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {app.applicant_email}
                    </p>
                  </div>
                </div>
              ))}
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

          <div className="flex items-center justify-between pt-4 border-t">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canAnalyze || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Iniciar Análise ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
