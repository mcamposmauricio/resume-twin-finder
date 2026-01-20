import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { JobStatus } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobPostingCard } from '@/components/jobs/JobPostingCard';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { jobPostings, loading, deleteJobPosting, changeStatus } = useJobPostings(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteJobPosting(deleteId);
      setDeleteId(null);
    }
  };

  const filteredJobs = jobPostings.filter((job) => {
    if (statusFilter === 'all') return true;
    return job.status === statusFilter;
  });

  const counts = {
    all: jobPostings.length,
    active: jobPostings.filter((j) => j.status === 'active').length,
    draft: jobPostings.filter((j) => j.status === 'draft').length,
    paused: jobPostings.filter((j) => j.status === 'paused').length,
    closed: jobPostings.filter((j) => j.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Vagas</h1>
            <p className="text-muted-foreground">
              Gerencie suas vagas e candidaturas
            </p>
          </div>
          <Button onClick={() => navigate('/vagas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Vaga
          </Button>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
            <TabsTrigger value="active">Ativas ({counts.active})</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos ({counts.draft})</TabsTrigger>
            <TabsTrigger value="paused">Pausadas ({counts.paused})</TabsTrigger>
            <TabsTrigger value="closed">Encerradas ({counts.closed})</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {statusFilter === 'all'
                  ? 'Nenhuma vaga criada'
                  : `Nenhuma vaga ${statusFilter === 'active' ? 'ativa' : statusFilter === 'draft' ? 'em rascunho' : statusFilter === 'paused' ? 'pausada' : 'encerrada'}`}
              </h3>
              <p className="text-muted-foreground text-center">
                Crie sua primeira vaga usando o botão acima.
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
              />
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
}
