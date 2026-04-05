import { User, Mail, Phone, FileText, Download, ExternalLink, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TalentProfile } from '@/hooks/useTalentPool';
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

interface TalentDetailPanelProps {
  talent: TalentProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TalentDetailPanel({ talent, open, onOpenChange }: TalentDetailPanelProps) {
  if (!talent) return null;

  const latestFormData = talent.latestApplication.form_data || {};

  // Extract relevant form fields
  const formFields = Object.entries(latestFormData).filter(
    ([key]) => !['Nome completo', 'nome_completo', 'name', 'Email', 'email', 'Telefone', 'telefone', 'phone'].includes(key)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className="truncate">{talent.name}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-2">
            <p className="text-sm flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              {talent.email}
            </p>
            {talent.phone && (
              <p className="text-sm flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                {talent.phone}
              </p>
            )}
          </div>

          {/* Resume */}
          {talent.latestResumeUrl && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Currículo</h4>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {talent.latestResumeFilename || 'Currículo'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(talent.latestResumeUrl!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Abrir
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Application History */}
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-3">
              Histórico de Aplicações ({talent.totalApplications})
            </h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Vaga</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Etapa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talent.applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="text-xs font-medium py-2">
                        {app.job_title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2 whitespace-nowrap">
                        {format(new Date(app.created_at), 'dd/MM/yy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] ${TRIAGE_STYLES[app.triage_status] || ''}`}
                        >
                          {TRIAGE_LABELS[app.triage_status] || app.triage_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Additional Form Data */}
          {formFields.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Dados do Formulário</h4>
                <div className="space-y-2">
                  {formFields.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{key}</span>
                      <span className="text-xs font-medium text-right">
                        {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
