import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { ShareJobLink } from '@/components/jobs/ShareJobLink';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { useUserRole } from '@/hooks/useUserRole';
import { WorkType, JobStatus, JobPosting } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast as sonnerToast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLog';

export default function JobPostingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobPosting | null>(null);
  const [profileCompanyName, setProfileCompanyName] = useState<string>('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location_, setLocation_] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');
  const [formTemplateId, setFormTemplateId] = useState<string>('');

  const { createJobPosting, updateJobPosting, getJobById } = useJobPostings(userId);
  const { templates } = useFormTemplates(userId);
  const { isFullAccess, loading: roleLoading } = useUserRole(userId);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
        // Fetch company name from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name')
          .eq('user_id', session.user.id)
          .single();
        if (profile?.company_name) {
          setProfileCompanyName(profile.company_name);
        }
      }
    };
    loadSession();
  }, [navigate]);

  // Redirect non-full-access users - only check after role is loaded
  useEffect(() => {
    // Wait until we have userId AND role has finished loading
    if (userId && !roleLoading) {
      if (!isFullAccess) {
        sonnerToast.error('Você não tem acesso a esta funcionalidade.');
        navigate('/');
      }
    }
  }, [roleLoading, isFullAccess, userId, navigate]);

  // Load clone data from navigation state
  useEffect(() => {
    const state = location.state as { cloneFrom?: Partial<JobPosting> } | null;
    if (state?.cloneFrom && !id) {
      const clone = state.cloneFrom;
      setTitle(clone.title ? `${clone.title} (Cópia)` : '');
      setDescription(clone.description || '');
      setRequirements(clone.requirements || '');
      setLocation_(clone.location || '');
      setSalaryRange(clone.salary_range || '');
      setWorkType(clone.work_type || '');
      setFormTemplateId(clone.form_template_id || '');
    }
  }, [location.state, id]);

  useEffect(() => {
    if (id && userId) {
      getJobById(id).then((job) => {
        if (job) {
          setCurrentJob(job);
          setTitle(job.title);
          setDescription(job.description);
          setRequirements(job.requirements || '');
          setLocation_(job.location || '');
          setSalaryRange(job.salary_range || '');
          setWorkType(job.work_type || '');
          setFormTemplateId(job.form_template_id || '');
        }
      });
    }
  }, [id, userId]);


  const handleSave = async (status: JobStatus) => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Título e descrição são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (status === 'active' && !formTemplateId) {
      toast({
        title: 'Formulário obrigatório',
        description: 'Selecione um formulário de candidatura para publicar a vaga.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const data: any = {
        title,
        description,
        requirements: requirements || undefined,
        location: location_ || undefined,
        salary_range: salaryRange || undefined,
        work_type: workType || undefined,
        form_template_id: formTemplateId || undefined,
        status,
      };

      if (id) {
        // Reset analyzed_at when editing a job (allows re-analysis)
        data.analyzed_at = null;
        await updateJobPosting(id, data);
      } else {
        await createJobPosting(data);
      }
      navigate('/vagas');
    } catch (error: any) {
      console.error('Error saving job:', error);
      logActivity({
        userId: userId || 'unknown',
        userEmail: 'unknown',
        actionType: id ? 'job_update_error' : 'job_create_error',
        isError: true,
        metadata: { error_message: error.message, job_id: id },
      });
      toast({
        title: 'Erro ao salvar vaga',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vagas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {id ? 'Editar Vaga' : 'Nova Vaga'}
            </h1>
          </div>
        </div>
        <div className="space-y-6">
          {/* Public Link Card - only show for active jobs */}
          {currentJob?.status === 'active' && currentJob?.public_slug && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-3">
                  <span className="font-medium">✅ Vaga Publicada!</span>
                </div>
                <ShareJobLink 
                  slug={currentJob.public_slug} 
                  jobTitle={currentJob.title}
                  companyName={profileCompanyName || undefined}
                  variant="compact"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informações da Vaga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da vaga *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Desenvolvedor Frontend Senior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva as responsabilidades e atividades da vaga..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos</Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Liste os requisitos e qualificações necessárias..."
                  rows={4}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={location_}
                  onChange={(e) => setLocation_(e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                />
              </div>

                <div className="space-y-2">
                  <Label htmlFor="workType">Tipo de trabalho</Label>
                  <Select
                    value={workType}
                    onValueChange={(v) => setWorkType(v as WorkType)}
                  >
                    <SelectTrigger id="workType">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remoto</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                      <SelectItem value="onsite">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryRange">Faixa salarial</Label>
                <Input
                  id="salaryRange"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="Ex: R$ 8.000 - R$ 12.000"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formulário de Candidatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formTemplate">Modelo de formulário</Label>
                <Select
                  value={formTemplateId}
                  onValueChange={setFormTemplateId}
                >
                  <SelectTrigger id="formTemplate">
                    <SelectValue placeholder="Selecione um modelo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.fields.length} campos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Não tem um modelo?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate('/formularios/novo')}
                  >
                    Crie um novo
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button onClick={() => handleSave('active')} disabled={saving}>
              <Send className="h-4 w-4 mr-2" />
              Publicar Vaga
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}