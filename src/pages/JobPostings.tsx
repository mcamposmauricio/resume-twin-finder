import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Globe, ExternalLink, Copy, Settings, LogOut, FileText, Activity, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { useUserRole } from '@/hooks/useUserRole';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { JobPostingCard } from '@/components/jobs/JobPostingCard';
import { JobTimeline, TimelineStatus } from '@/components/jobs/JobTimeline';
import { NewJobDialog } from '@/components/jobs/NewJobDialog';

import { MarqBanner } from '@/components/MarqBanner';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import logoMarq from '@/assets/logo-marq-blue.png';

export default function JobPostings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TimelineStatus>('active');
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [careersPageSlug, setCareersPageSlug] = useState<string | null>(null);
  const [careersPageEnabled, setCareersPageEnabled] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const { jobPostings, loading, deleteJobPosting, changeStatus } = useJobPostings(userId);
  const { isFullAccess, loading: roleLoading } = useUserRole(userId);
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate('/vagas')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent">
                CompareCV
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">powered by</span>
                <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
                </a>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Primary action: Nova Vaga */}
            <Button
              onClick={() => setShowNewJobDialog(true)}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Vaga</span>
            </Button>

            {/* Secondary actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate('/banco-de-talentos')} className="cursor-pointer py-2.5">
                  <Users className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  <span>Banco de Talentos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/formularios')} className="cursor-pointer py-2.5">
                  <FileText className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  <span>Modelos de Formulário</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="cursor-pointer py-2.5">
                  <Settings className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                {userEmail === 'mauricio@marqponto.com.br' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/atividades')} className="cursor-pointer py-2.5">
                      <Activity className="w-4 h-4 mr-2.5 text-muted-foreground" />
                      <span>Log de Atividades</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[150px]">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* MarQ Banner */}
      <MarqBanner userId={userId} />

      <div className="container mx-auto px-4 py-8 max-w-5xl flex-1">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Acompanhamento de Vagas</h1>
            <p className="text-muted-foreground">
              Acompanhe o ciclo de vida das suas vagas
            </p>
          </div>
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
                  onClick={() => navigate('/configuracoes?tab=careers')}
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

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border bg-card">
        <div className="flex items-center justify-center gap-2">
          <span>CompareCV powered by</span>
          <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer">
            <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
          </a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
