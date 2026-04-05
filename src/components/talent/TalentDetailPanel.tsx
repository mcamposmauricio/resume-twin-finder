import { useState, useEffect } from 'react';
import { User, Mail, Phone, FileText, Download, Flame, Thermometer, Snowflake, LinkIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TalentPoolRow, TalentApplication, useTalentDetail } from '@/hooks/useTalentPool';
import { TalentTimeline } from './TalentTimeline';
import { LinkToJobDialog } from './LinkToJobDialog';

function getScoreBadge(score: number) {
  if (score > 70) return { label: 'Quente', icon: Flame, className: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (score >= 40) return { label: 'Morno', icon: Thermometer, className: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Frio', icon: Snowflake, className: 'bg-sky-100 text-sky-700 border-sky-200' };
}

const TRIAGE_PRIORITY: Record<string, number> = {
  deserves_analysis: 3,
  new: 2,
  low_fit: 1,
};

interface TalentDetailPanelProps {
  talent: TalentPoolRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function TalentDetailPanel({ talent, open, onOpenChange, userId }: TalentDetailPanelProps) {
  const { applications, loading: detailLoading, fetchDetail } = useTalentDetail(userId);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    if (open && talent?.email) {
      fetchDetail(talent.email);
    }
  }, [open, talent?.email]);

  if (!talent) return null;

  const scoreBadge = getScoreBadge(talent.score);
  const ScoreIcon = scoreBadge.icon;

  // Find best triage application
  const bestApp = applications.reduce<TalentApplication | null>((best, app) => {
    if (!best) return app;
    const bestPriority = TRIAGE_PRIORITY[best.triage_status] || 0;
    const appPriority = TRIAGE_PRIORITY[app.triage_status] || 0;
    return appPriority > bestPriority ? app : best;
  }, null);

  // Get form data from latest application
  const latestFormData = applications[0]?.form_data || {};
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
            <div className="min-w-0 flex-1">
              <span className="truncate block">{talent.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${scoreBadge.className}`}>
                  <ScoreIcon className="w-3 h-3" />
                  {scoreBadge.label} ({talent.score}pts)
                </Badge>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {/* Contact Info */}
          <div className="space-y-1.5 mb-4">
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

          {/* Resume quick access */}
          {talent.latest_resume_url && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {talent.latest_resume_filename || 'Currículo'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(talent.latest_resume_url!, '_blank')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Abrir
                </Button>
              </div>
              <Separator className="mb-4" />
            </>
          )}

          {/* Link to job */}
          {userId && (
            <>
              <Button
                variant="default"
                size="sm"
                className="w-full mb-4"
                onClick={() => setLinkDialogOpen(true)}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Vincular a uma vaga
              </Button>

              <LinkToJobDialog
                talent={talent}
                userId={userId}
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
                onSuccess={() => fetchDetail(talent.email)}
              />
            </>
          )}

          {/* Tabs */}
          <Tabs defaultValue="history">
            <TabsList className="w-full">
              <TabsTrigger value="history" className="flex-1">Histórico</TabsTrigger>
              <TabsTrigger value="data" className="flex-1">Dados</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              {detailLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : applications.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold mb-3">
                    {applications.length} {applications.length === 1 ? 'aplicação' : 'aplicações'}
                  </p>
                  <TalentTimeline applications={applications} bestTriageId={bestApp?.id} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma aplicação encontrada.</p>
              )}
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              {detailLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : formFields.length > 0 ? (
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
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum dado adicional.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
