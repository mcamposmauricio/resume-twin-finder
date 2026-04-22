import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Globe, ExternalLink, Copy, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJobPostings } from '@/hooks/useJobPostings';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { JobPostingCard } from '@/components/jobs/JobPostingCard';
import { JobTimeline, TimelineStatus } from '@/components/jobs/JobTimeline';
import { NewJobDialog } from '@/components/jobs/NewJobDialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarqBanner } from '@/components/MarqBanner';
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
  const { userId } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TimelineStatus>('active');
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [careersPageSlug, setCareersPageSlug] = useState<string | null>(null);
  const [careersPageEnabled, setCareersPageEnabled] = useState(false);
  const { jobPostings, loading, deleteJobPosting, changeStatus } = useJobPostings(userId);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('careers_page_slug, careers_page_enabled')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCareersPageSlug(data.careers_page_slug);
          setCareersPageEnabled(data.careers_page_enabled || false);
        }
      });
  }, [userId]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteJobPosting(deleteId);
      setDeleteId(null);
    }
  };

  // Optimized: single loop for counts
  const counts = useMemo(() => {
    const c = { draft: 0, active: 0, paused: 0, closed: 0 };
    for (const j of jobPostings) {
      if (j.status in c) c[j.status as keyof typeof c]++;
    }
    return c;
  }, [jobPostings]);

  // Filter jobs based on timeline status
  const filteredJobs = useMemo(() => {
    return jobPostings.filter((job) => job.status === statusFilter);
  }, [jobPostings, statusFilter]);

  // Get empty state message based on current filter
  const getEmptyMessage = () => {
    switch (statusFilter) {
      case 'draft': return 'Nenhuma vaga em rascunho';
      case 'active': return 'Nenhuma vaga publicada';
      case 'paused': return 'Nenhuma vaga pausada';
      case 'closed': return 'Nenhuma vaga encerrada';
      default: return 'Nenhuma vaga encontrada';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* MarQ Banner */}
      <MarqBanner userId={userId} />

      <div className="container mx-auto px-4 py-8 max-w-[100rem]">
        {/* Page Title + Nova Vaga */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Acompanhamento de Vagas</h1>
            <p className="text-muted-foreground">
              Acompanhe o ciclo de vida das suas vagas
            </p>
          </div>
          <Button onClick={() => setShowNewJobDialog(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Vaga</span>
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
              <p className="text-muted-foreground text-center mb-4">
                {statusFilter === 'draft' || statusFilter === 'active'
                  ? 'Crie sua primeira vaga para começar.'
                  : 'As vagas aparecerão aqui conforme avançam no ciclo.'}
              </p>
              {(statusFilter === 'draft' || statusFilter === 'active') && (
                <Button onClick={() => setShowNewJobDialog(true)} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Criar Vaga
                </Button>
              )}
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
    </AppLayout>
  );
}
