import { useState, useEffect, useMemo } from 'react';
import { Search, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TalentPoolRow } from '@/hooks/useTalentPool';

interface LinkToJobDialogProps {
  talent: TalentPoolRow;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ActiveJob {
  id: string;
  title: string;
  location: string | null;
  work_type: string | null;
}

export function LinkToJobDialog({ talent, userId, open, onOpenChange, onSuccess }: LinkToJobDialogProps) {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    setLoading(true);
    supabase
      .from('job_postings')
      .select('id, title, location, work_type')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setJobs(data || []);
        setLoading(false);
      });
  }, [open, userId]);

  const filtered = useMemo(() => {
    if (!search) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q));
  }, [jobs, search]);

  const handleLink = async (job: ActiveJob) => {
    setLinking(job.id);
    try {
      const { data: isDuplicate } = await supabase.rpc('check_duplicate_application', {
        _job_posting_id: job.id,
        _email: talent.email,
      });

      if (isDuplicate) {
        toast.error('Candidato já aplicou nesta vaga');
        setLinking(null);
        return;
      }

      const { error } = await supabase.from('job_applications').insert({
        job_posting_id: job.id,
        applicant_email: talent.email,
        applicant_name: talent.name,
        resume_url: talent.latest_resume_url,
        resume_filename: talent.latest_resume_filename,
        triage_status: 'new',
        status: 'pending',
        form_data: {},
      });

      if (error) throw error;

      toast.success(`${talent.name} vinculado(a) à vaga "${job.title}"`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao vincular candidato à vaga');
    } finally {
      setLinking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular a uma vaga</DialogTitle>
          <DialogDescription>
            Selecione uma vaga ativa para vincular <strong>{talent.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vaga..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {jobs.length === 0 ? 'Nenhuma vaga ativa encontrada.' : 'Nenhuma vaga corresponde à busca.'}
            </p>
          ) : (
            filtered.map(job => (
              <button
                key={job.id}
                disabled={linking !== null}
                onClick={() => handleLink(job)}
                className="w-full text-left p-3 rounded-md border hover:bg-accent/50 transition-colors disabled:opacity-50 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {job.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{job.location}
                      </span>
                    )}
                    {job.work_type && (
                      <Badge variant="secondary" className="text-[10px]">{job.work_type}</Badge>
                    )}
                  </div>
                </div>
                {linking === job.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                ) : (
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
