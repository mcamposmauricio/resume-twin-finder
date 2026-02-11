import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Copy, Search, Briefcase, Loader2, FileText } from 'lucide-react';
import { JobPosting } from '@/types/jobs';
import { useJobTemplates } from '@/hooks/useJobTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobPostings: JobPosting[];
}

export function NewJobDialog({ open, onOpenChange, jobPostings }: NewJobDialogProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choice' | 'clone' | 'template'>('choice');
  const [search, setSearch] = useState('');
  const { templates, loading: templatesLoading } = useJobTemplates();
  const handleClose = () => {
    setMode('choice');
    setSearch('');
    onOpenChange(false);
  };

  const handleFromScratch = () => {
    handleClose();
    navigate('/vagas/nova');
  };

  const handleCloneJob = (job: JobPosting) => {
    handleClose();
    // Navigate with clone state
    navigate('/vagas/nova', {
      state: {
        cloneFrom: {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          salary_range: job.salary_range,
          work_type: job.work_type,
          form_template_id: job.form_template_id,
        },
      },
    });
  };

  const filteredJobs = jobPostings.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTemplates = templates.filter((tpl) =>
    tpl.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleUseTemplate = (tpl: typeof templates[0]) => {
    handleClose();
    navigate('/vagas/nova', {
      state: {
        cloneFrom: {
          title: tpl.title,
          description: tpl.description,
          requirements: tpl.requirements || '',
          salary_range: tpl.salary_range || '',
          work_type: tpl.work_type || '',
        },
      },
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'closed':
        return 'Encerrada';
      case 'paused':
        return 'Pausada';
      default:
        return 'Rascunho';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'choice' ? 'Criar Nova Vaga' : mode === 'clone' ? 'Selecione a vaga para clonar' : 'Selecione o modelo'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'choice' ? 'Escolha como deseja criar a vaga' : mode === 'clone' ? 'Selecione uma vaga existente para clonar' : 'Selecione um modelo de cargo'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'choice' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Como deseja criar a vaga?
            </p>
            
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={handleFromScratch}
            >
              <FilePlus className="h-5 w-5 mr-3 shrink-0" />
              <div className="text-left">
                <div className="font-medium">Começar do Zero</div>
                <div className="text-sm text-muted-foreground">
                  Crie uma vaga completamente nova
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => setMode('clone')}
              disabled={jobPostings.length === 0}
            >
              <Copy className="h-5 w-5 mr-3 shrink-0" />
              <div className="text-left">
                <div className="font-medium">Clonar Vaga Existente</div>
                <div className="text-sm text-muted-foreground">
                  {jobPostings.length === 0
                    ? 'Nenhuma vaga disponível para clonar'
                    : 'Copie os dados de uma vaga anterior'}
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => setMode('template')}
              disabled={templates.length === 0}
            >
              <FileText className="h-5 w-5 mr-3 shrink-0" />
              <div className="text-left">
                <div className="font-medium">Usar Modelo</div>
                <div className="text-sm text-muted-foreground">
                  {templates.length === 0
                    ? 'Nenhum modelo disponível'
                    : 'Comece a partir de um modelo de cargo'}
                </div>
              </div>
            </Button>
          </div>
        ) : mode === 'clone' ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vaga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma vaga encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredJobs.map((job) => (
                    <Button
                      key={job.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-3"
                      onClick={() => handleCloneJob(job)}
                    >
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate">{job.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusLabel(job.status)}
                          {job.location && ` • ${job.location}`}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode('choice')}
            >
              Voltar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum modelo encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((tpl) => (
                    <Button
                      key={tpl.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-3"
                      onClick={() => handleUseTemplate(tpl)}
                    >
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate">{tpl.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {tpl.description.substring(0, 100)}...
                        </div>
                        {tpl.salary_range && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Piso: {tpl.salary_range}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode('choice')}
            >
              Voltar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
