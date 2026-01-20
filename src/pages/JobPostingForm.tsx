import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { WorkType, JobStatus } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function JobPostingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');
  const [formTemplateId, setFormTemplateId] = useState<string>('');

  const { jobPostings, createJobPosting, updateJobPosting, getJobById } = useJobPostings(userId);
  const { templates } = useFormTemplates(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (id && userId) {
      getJobById(id).then((job) => {
        if (job) {
          setTitle(job.title);
          setDescription(job.description);
          setRequirements(job.requirements || '');
          setLocation(job.location || '');
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
      const data = {
        title,
        description,
        requirements: requirements || undefined,
        location: location || undefined,
        salary_range: salaryRange || undefined,
        work_type: workType || undefined,
        form_template_id: formTemplateId || undefined,
        status,
      };

      if (id) {
        await updateJobPosting(id, data);
      } else {
        await createJobPosting(data);
      }
      navigate('/vagas');
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
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
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
