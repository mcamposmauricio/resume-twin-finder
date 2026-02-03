import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, ArrowLeft, Globe, ExternalLink, Copy, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { JobPostingCard } from '@/components/jobs/JobPostingCard';
import { JobTimeline, TimelineStatus } from '@/components/jobs/JobTimeline';
import { NewJobDialog } from '@/components/jobs/NewJobDialog';
import { toast } from 'sonner';
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

export default function JobPostings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TimelineStatus>('draft');
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [careersPageSlug, setCareersPageSlug] = useState<string | null>(null);
  const [careersPageEnabled, setCareersPageEnabled] = useState(false);
  const { jobPostings, loading, deleteJobPosting, changeStatus } = useJobPostings(userId);
  const { isFullAccess, loading: roleLoading } = useUserRole(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
        // Fetch careers page settings
        supabase
          .from('profiles')
          .select('careers_page_slug, careers_page_enabled')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setCareersPageSlug(data.careers_page_slug);
              setCareersPageEnabled(data.careers_page_enabled || false);
            }
          });
      }
    });
  }, [navigate]);

  // Redirect non-full-access users
  useEffect(() => {
    if (!roleLoading && userId && !isFullAccess) {
      toast.error('Você não tem acesso a esta funcionalidade.');
      navigate('/');
    }
  }, [roleLoading, isFullAccess, userId, navigate]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteJobPosting(deleteId);
      setDeleteId(null);
    }
  };

  // Filter jobs based on timeline status
  const filteredJobs = jobPostings.filter((job) => {
    switch (statusFilter) {
      case 'draft':
        return job.status === 'draft';
      case 'active':
        return job.status === 'active';
      case 'paused':
        return job.status === 'paused';
      case 'closed':
        return job.status === 'closed' && !job.analyzed_at;
      case 'analyzed':
        return job.analyzed_at !== null;
      default:
        return true;
    }
  });

  // Calculate counts for each timeline step
  const counts = {
    draft: jobPostings.filter((j) => j.status === 'draft').length,
    active: jobPostings.filter((j) => j.status === 'active').length,
    paused: jobPostings.filter((j) => j.status === 'paused').length,
    closed: jobPostings.filter((j) => j.status === 'closed' && !j.analyzed_at).length,
    analyzed: jobPostings.filter((j) => j.analyzed_at !== null).length,
  };

  // Get empty state message based on current filter
  const getEmptyMessage = () => {
    switch (statusFilter) {
      case 'draft':
        return 'Nenhuma vaga em rascunho';
      case 'active':
        return 'Nenhuma vaga publicada';
      case 'paused':
        return 'Nenhuma vaga pausada';
      case 'closed':
        return 'Nenhuma vaga encerrada aguardando análise';
      case 'analyzed':
        return 'Nenhuma vaga foi analisada ainda';
      default:
        return 'Nenhuma vaga encontrada';
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Acompanhamento de Vagas</h1>
            <p className="text-muted-foreground">
              Acompanhe o ciclo de vida das suas vagas
            </p>
          </div>
          <Button onClick={() => setShowNewJobDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Vaga
          </Button>
        </div>

        {/* Careers Page Banner */}
        <Card className={`mb-6 ${careersPageEnabled ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-muted'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Globe className={`h-5 w-5 ${careersPageEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {careersPageEnabled ? 'Página de Carreiras Ativa' : 'Página de Carreiras'}
                </p>
                {careersPageEnabled && careersPageSlug ? (
                  <p className="text-xs text-muted-foreground">
                    {window.location.origin}/carreiras/{careersPageSlug}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Configure sua página pública de vagas
                  </p>
                )}
              </div>
              {careersPageEnabled && careersPageSlug ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/carreiras/${careersPageSlug}`);
                      toast.success('Link copiado!');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/carreiras/${careersPageSlug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/configuracoes')}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="mb-8 p-4 bg-card rounded-lg border">
          <JobTimeline
            counts={counts}
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        {/* Job listings */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">{getEmptyMessage()}</h3>
              <p className="text-muted-foreground text-center">
                {statusFilter === 'draft' 
                  ? 'Crie sua primeira vaga usando o botão acima.'
                  : 'As vagas aparecerão aqui conforme avançam no ciclo.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <JobPostingCard
                key={job.id}
                job={job}
                onView={() => navigate(`/vagas/${job.id}`)}
                onEdit={() => navigate(`/vagas/${job.id}/editar`)}
                onDelete={() => setDeleteId(job.id)}
                onChangeStatus={(status) => changeStatus(job.id, status)}
                onSendToAnalysis={
                  job.status === 'closed' && (job.applications_count || 0) > 0
                    ? () => navigate(`/vagas/${job.id}?openAnalysis=true`)
                    : undefined
                }
                isAnalyzedView={statusFilter === 'analyzed'}
                onViewAnalysis={
                  job.analysis_id
                    ? () => navigate(`/?viewAnalysis=${job.analysis_id}`)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as candidaturas
                associadas a esta vaga também serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* New job dialog */}
        <NewJobDialog
          open={showNewJobDialog}
          onOpenChange={setShowNewJobDialog}
          jobPostings={jobPostings}
        />
      </div>
    </div>
  );
}
