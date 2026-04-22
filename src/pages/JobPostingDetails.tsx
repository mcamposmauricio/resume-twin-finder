import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { renderFormattedText } from '@/lib/formatText';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Pause,
  Play,
  XCircle,
  // [AI-FLOW] Send,
  Pencil,
  Link as LinkIcon,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { useJobApplications } from '@/hooks/useJobApplications';
// [AI-FLOW] import { useResumeBalance } from '@/hooks/useResumeBalance';
// [AI-FLOW] import { useUserRole } from '@/hooks/useUserRole';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { JobPosting, JobApplication, STATUS_LABELS, WORK_TYPE_LABELS } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApplicationKanban } from '@/components/jobs/ApplicationKanban';
import { AppLayout } from '@/components/layout/AppLayout';
import { ApplicationDetailPanel } from '@/components/jobs/ApplicationDetailPanel';
import { CloseJobDialog } from '@/components/jobs/CloseJobDialog';
// [AI-FLOW] import { SendToAnalysisDialog } from '@/components/jobs/SendToAnalysisDialog';

import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function JobPostingDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  // [AI-FLOW] const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<JobApplication | null>(null);

  const { changeStatus, getJobById } = useJobPostings(userId);
  const { applications, getResumeUrl, updateTriageStatus, deleteApplication, refetch: refetchApplications } = useJobApplications(id);
  // [AI-FLOW] const resumeBalance = useResumeBalance(userId);
  // [AI-FLOW] const balance = resumeBalance.availableResumes;
  // [AI-FLOW] const { isFullAccess, loading: roleLoading } = useUserRole(userId);
  const { stages, loading: stagesLoading } = usePipelineStages(userId);

  // Sync viewingApplication when applications array changes (e.g. Kanban stage move)
  useEffect(() => {
    if (viewingApplication) {
      const updated = applications.find(a => a.id === viewingApplication.id);
      if (updated) setViewingApplication(updated);
    }
  }, [applications]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  // [AI-FLOW] Role guard removed — all users have access

  useEffect(() => {
    if (id && userId) {
      setLoading(true);
      getJobById(id)
        .then((data) => setJob(data))
        .finally(() => setLoading(false));
    }
  }, [id, userId]);

  // [AI-FLOW] Analysis dialog auto-open removed

  const handleViewResume = async (app: JobApplication) => {
    if (!app.resume_url) return;
    const url = await getResumeUrl(app.resume_url);
    if (url) {
      window.open(url, '_blank');
    }
  };


  const handleCloseJob = async () => {
    if (!job) return;
    await changeStatus(job.id, 'closed');
    setJob({ ...job, status: 'closed', closed_at: new Date().toISOString() });
    setShowCloseDialog(false);
  };

  const handlePauseResume = async () => {
    if (!job) return;
    const newStatus = job.status === 'paused' ? 'active' : 'paused';
    await changeStatus(job.id, newStatus);
    setJob({ ...job, status: newStatus });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove o prefixo "data:...;base64," para obter apenas o base64 puro
        const base64Content = result.split(',')[1] || result;
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // [AI-FLOW] handleSendToAnalysis commented out — analysis flow disabled
  // const handleSendToAnalysis = async (applicationIds: string[]) => { ... };

  if (loading || stagesLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Vaga não encontrada</h2>
            <Button onClick={() => navigate('/vagas')}>Voltar para Vagas</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <button onClick={() => navigate('/vagas')} className="hover:text-foreground transition-colors">
            Vagas
          </button>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[300px]">{job.title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vagas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <Badge className={STATUS_COLORS[job.status]}>
                {STATUS_LABELS[job.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {job.location && <span>{job.location}</span>}
              {job.work_type && <span>{WORK_TYPE_LABELS[job.work_type]}</span>}
              <span>
                Criada em{' '}
                {format(new Date(job.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">

              <div className="flex items-center gap-2 ml-auto">
                {(job.status === 'draft' || job.status === 'paused') && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/vagas/${job.id}/editar`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}

                {(job.status === 'active' || job.status === 'paused') && (
                  <>
                    <Button variant="outline" onClick={handlePauseResume}>
                      {job.status === 'paused' ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Reativar
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCloseDialog(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Encerrar
                    </Button>
                  </>
                )}

                {/* [AI-FLOW] Analysis buttons removed */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info compacto */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-6 flex-wrap text-sm">
              {job.status === 'active' && job.public_slug && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Link público:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[250px]">
                    {window.location.origin}/apply/{job.public_slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/apply/${job.public_slug}`);
                      sonnerToast.success('Link copiado!');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => window.open(`/apply/${job.public_slug}`, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {job.salary_range && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Salário:</span>
                  <span className="font-medium">{job.salary_range}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Candidaturas:</span>
                <span className="font-medium">{applications.length}</span>
              </div>
              {job.closed_at && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Encerrada em:</span>
                  <span className="font-medium">
                    {format(new Date(job.closed_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Applications Kanban */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Candidaturas ({applications.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/configuracoes?tab=pipeline')}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar etapas do processo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ApplicationKanban
              applications={applications}
              stages={stages}
              onViewDetails={setViewingApplication}
              onViewResume={handleViewResume}
              onUpdateTriageStatus={updateTriageStatus}
              onDeleteApplication={async (id) => {
                const success = await deleteApplication(id);
                if (success && viewingApplication?.id === id) {
                  setViewingApplication(null);
                }
                return success;
              }}
            />
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição da Vaga</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="break-words">{renderFormattedText(job.description)}</div>
            {job.requirements && !job.description?.toLowerCase().includes('requisitos') && (
              <>
                <Separator className="my-4" />
                <h4 className="font-medium mb-2">Requisitos</h4>
                <div className="break-words text-muted-foreground">
                  {renderFormattedText(job.requirements)}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CloseJobDialog
          open={showCloseDialog}
          onOpenChange={setShowCloseDialog}
          onConfirm={handleCloseJob}
          jobTitle={job.title}
        />

        {/* [AI-FLOW] SendToAnalysisDialog removed */}

        <ApplicationDetailPanel
          open={!!viewingApplication}
          onOpenChange={(open) => !open && setViewingApplication(null)}
          application={viewingApplication}
          applications={applications}
          formFields={job.form_template?.fields || []}
          stages={stages}
          onNavigate={(direction) => {
            if (!viewingApplication) return;
            const currentIndex = applications.findIndex(a => a.id === viewingApplication.id);
            const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (nextIndex >= 0 && nextIndex < applications.length) {
              setViewingApplication(applications[nextIndex]);
            }
          }}
          onUpdateTriageStatus={updateTriageStatus}
          getResumeUrl={getResumeUrl}
          onDelete={async () => {
            if (!viewingApplication) return;
            const success = await deleteApplication(viewingApplication.id);
            if (success) setViewingApplication(null);
          }}
        />
      </div>
    </AppLayout>
  );
}
