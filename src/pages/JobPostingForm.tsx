import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Sparkles, Copy, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useJobPostings } from '@/hooks/useJobPostings';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { WorkType, JobStatus, JobPosting } from '@/types/jobs';
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
  const [currentJob, setCurrentJob] = useState<JobPosting | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');
  const [formTemplateId, setFormTemplateId] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#3B82F6');

  const { createJobPosting, updateJobPosting, getJobById } = useJobPostings(userId);
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
          setCurrentJob(job);
          setTitle(job.title);
          setDescription(job.description);
          setRequirements(job.requirements || '');
          setLocation(job.location || '');
          setSalaryRange(job.salary_range || '');
          setWorkType(job.work_type || '');
          setFormTemplateId(job.form_template_id || '');
          setCompanyName(job.company_name || '');
          setCompanyLogoUrl(job.company_logo_url || '');
          setBrandColor(job.brand_color || '#3B82F6');
        }
      });
    }
  }, [id, userId]);

  const fillTestData = () => {
    setTitle('Desenvolvedor Full Stack Senior');
    setDescription(`Estamos buscando um Desenvolvedor Full Stack Senior para se juntar à nossa equipe de tecnologia.

Responsabilidades:
• Desenvolver e manter aplicações web escaláveis
• Colaborar com o time de produto e design
• Participar de code reviews e mentoria de desenvolvedores júnior
• Propor soluções técnicas inovadoras`);
    setRequirements(`• 5+ anos de experiência com desenvolvimento web
• Conhecimento sólido em React, Node.js e TypeScript
• Experiência com bancos de dados SQL e NoSQL
• Familiaridade com metodologias ágeis
• Boa comunicação e trabalho em equipe
• Inglês intermediário/avançado`);
    setLocation('São Paulo, SP');
    setSalaryRange('R$ 12.000 - R$ 18.000');
    setWorkType('remote');
  };

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
        company_name: companyName || undefined,
        company_logo_url: companyLogoUrl || undefined,
        brand_color: brandColor || undefined,
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

  const copyPublicLink = () => {
    if (currentJob?.public_slug) {
      const link = `${window.location.origin}/apply/${currentJob.public_slug}`;
      navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado!',
        description: 'O link público foi copiado para a área de transferência.',
      });
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
          {!id && (
            <Button variant="outline" size="sm" onClick={fillTestData}>
              <Sparkles className="h-4 w-4 mr-2" />
              Preencher Exemplo
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Public Link Card - only show for active jobs */}
          {currentJob?.status === 'active' && currentJob?.public_slug && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-1">
                      <Link className="h-4 w-4" />
                      <span className="font-medium">Vaga Publicada!</span>
                    </div>
                    <code className="text-sm bg-white dark:bg-green-900 px-2 py-1 rounded block truncate">
                      {window.location.origin}/apply/{currentJob.public_slug}
                    </code>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyPublicLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                </div>
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

          <Card>
            <CardHeader>
              <CardTitle>Personalização da Página</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Personalize a página pública de candidatura com a identidade da sua empresa.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da empresa</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Minha Empresa LTDA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLogoUrl">URL do logo</Label>
                <Input
                  id="companyLogoUrl"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL de uma imagem do logo da empresa (recomendado: PNG ou SVG transparente)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandColor">Cor principal</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brandColor"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
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