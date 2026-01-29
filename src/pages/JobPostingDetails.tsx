import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Pause,
  Play,
  XCircle,
  Send,
  Pencil,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { useJobApplications } from '@/hooks/useJobApplications';
import { useResumeBalance } from '@/hooks/useResumeBalance';
import { useUserRole } from '@/hooks/useUserRole';
import { JobPosting, JobApplication, STATUS_LABELS, WORK_TYPE_LABELS } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApplicationKanban } from '@/components/jobs/ApplicationKanban';
import { ApplicationDetailPanel } from '@/components/jobs/ApplicationDetailPanel';
import { CloseJobDialog } from '@/components/jobs/CloseJobDialog';
import { SendToAnalysisDialog } from '@/components/jobs/SendToAnalysisDialog';
import { ShareJobLink } from '@/components/jobs/ShareJobLink';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

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
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<JobApplication | null>(null);

  const { changeStatus, getJobById } = useJobPostings(userId);
  const { applications, getResumeUrl, updateTriageStatus, refetch: refetchApplications } = useJobApplications(id);
  const resumeBalance = useResumeBalance(userId);
  const balance = resumeBalance.availableResumes;
  const { isFullAccess, loading: roleLoading } = useUserRole(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  // Redirect non-full-access users
  useEffect(() => {
    if (!roleLoading && userId && !isFullAccess) {
      sonnerToast.error('Você não tem acesso a esta funcionalidade.');
      navigate('/');
    }
  }, [roleLoading, isFullAccess, userId, navigate]);

  useEffect(() => {
    if (id && userId) {
      setLoading(true);
      getJobById(id)
        .then((data) => setJob(data))
        .finally(() => setLoading(false));
    }
  }, [id, userId]);

  // Open analysis dialog if URL has openAnalysis=true
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('openAnalysis') === 'true' && job?.status === 'closed') {
      setShowAnalysisDialog(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [job]);

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

  const handleSendToAnalysis = async (applicationIds: string[]) => {
    try {
      // Check if user is blocked before starting analysis
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile?.is_blocked) {
        toast({
          title: 'Conta bloqueada',
          description: 'Sua conta está bloqueada. Entre em contato com o administrador.',
          variant: 'destructive',
        });
        return;
      }

      // 1. Filter selected applications
      const selectedApps = applications.filter((a) => applicationIds.includes(a.id));

      // 2. Download resumes from storage and convert to base64
      const filesPromises = selectedApps.map(async (app) => {
        if (!app.resume_url) return null;

        const { data, error } = await supabase.storage
          .from('resumes')
          .download(app.resume_url);

        if (error || !data) {
          console.error('Error downloading resume:', error);
          return null;
        }

        const base64 = await blobToBase64(data);
        return {
          name: app.resume_filename || 'resume.pdf',
          content: base64,
          type: data.type || 'application/pdf',
        };
      });

      const files = await Promise.all(filesPromises);
      const validFiles = files.filter(Boolean);

      if (validFiles.length === 0) {
        throw new Error('Não foi possível carregar os currículos selecionados.');
      }

      // 3. Build complete job description
      const jobDescription = `${job?.title || ''}\n\n${job?.description || ''}\n\nRequisitos:\n${job?.requirements || 'Não especificado'}`;

      // 4. Call analyze-resumes edge function with job title and id
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-resumes',
        {
          body: {
            files: validFiles,
            jobDescription,
            user_id: userId,
            job_title: job?.title,
            job_posting_id: job?.id,
          },
        }
      );

      if (analysisError) throw analysisError;

      if (analysisData.error) {
        throw new Error(analysisData.error);
      }

      // 5. If returned job_id, redirect to Index with polling
      if (analysisData.job_id) {
        toast({
          title: 'Análise iniciada',
          description: 'Você será redirecionado para acompanhar o progresso.',
        });
        
        // Store application IDs in sessionStorage to link after completion
        sessionStorage.setItem('pendingAnalysisApplicationIds', JSON.stringify(applicationIds));
        sessionStorage.setItem('pendingAnalysisJobPostingId', job?.id || '');
        
        // Redirect to Index with job_id for polling
        navigate(`/?analysisJobId=${analysisData.job_id}`);
      } else {
        // Direct results (fallback)
        toast({
          title: 'Análise concluída',
          description: `${applicationIds.length} currículos analisados com sucesso.`,
        });
        refetchApplications();
        setShowAnalysisDialog(false);
      }
    } catch (error: any) {
      console.error('Error sending to analysis:', error);
      toast({
        title: 'Erro ao enviar para análise',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isFullAccess) {
    return null;
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Vaga não encontrada</h2>
          <Button onClick={() => navigate('/vagas')}>Voltar para Vagas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
              {job.analyzed_at && (
                <Badge variant="outline" className="text-primary border-primary">
                  Analisado
                </Badge>
              )}
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
              {job.status === 'active' && (
                <div className="flex-1">
                  <ShareJobLink 
                    slug={job.public_slug} 
                    jobTitle={job.title}
                    companyName={job.company_name || undefined}
                    variant="full"
                  />
                </div>
              )}

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

                {job.status === 'closed' && applications.length > 0 && !job.analyzed_at && (
                  <Button onClick={() => setShowAnalysisDialog(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Análise
                  </Button>
                )}

                {job.status === 'closed' && job.analyzed_at && (
                  <Button variant="outline" disabled>
                    <Send className="h-4 w-4 mr-2" />
                    Já Analisado
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.description}</p>
              {job.requirements && (
                <>
                  <Separator className="my-4" />
                  <h4 className="font-medium mb-2">Requisitos</h4>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {job.requirements}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.salary_range && (
                <div>
                  <p className="text-sm text-muted-foreground">Faixa salarial</p>
                  <p className="font-medium">{job.salary_range}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Candidaturas</p>
                <p className="font-medium">{applications.length}</p>
              </div>
              {job.closed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Encerrada em</p>
                  <p className="font-medium">
                    {format(new Date(job.closed_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Applications Kanban */}
        <Card>
          <CardHeader>
            <CardTitle>Candidaturas ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationKanban
              applications={applications}
              onViewDetails={setViewingApplication}
              onViewResume={handleViewResume}
              onUpdateTriageStatus={updateTriageStatus}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CloseJobDialog
          open={showCloseDialog}
          onOpenChange={setShowCloseDialog}
          onConfirm={handleCloseJob}
          jobTitle={job.title}
        />

        <SendToAnalysisDialog
          open={showAnalysisDialog}
          onOpenChange={setShowAnalysisDialog}
          applications={applications}
          balance={balance}
          onConfirm={handleSendToAnalysis}
        />

        <ApplicationDetailPanel
          open={!!viewingApplication}
          onOpenChange={(open) => !open && setViewingApplication(null)}
          application={viewingApplication}
          applications={applications}
          formFields={job.form_template?.fields || []}
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
        />
      </div>
    </div>
  );
}
