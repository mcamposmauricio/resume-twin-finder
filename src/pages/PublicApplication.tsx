import { useState, useEffect } from 'react';
import { renderFormattedText } from '@/lib/formatText';
import { useParams } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobPosting, FormField, WorkType, JobStatus } from '@/types/jobs';
import { WORK_TYPE_LABELS } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLog';
import logoBlue from '@/assets/logo-marq-blue.png';

export default function PublicApplication() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  // Profile branding
  const [profileBranding, setProfileBranding] = useState<{
    company_name: string | null;
    company_logo_url: string | null;
    brand_color: string | null;
    careers_page_slug: string | null;
    careers_page_enabled: boolean;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchJob = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('job_postings')
          .select(`
            *,
            form_template:form_templates(*)
          `)
          .eq('public_slug', slug)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setJob({
            ...data,
            work_type: data.work_type as WorkType | undefined,
            status: data.status as JobStatus,
            company_name: data.company_name || undefined,
            company_logo_url: data.company_logo_url || undefined,
            brand_color: data.brand_color || '#3B82F6',
            form_template: data.form_template
              ? {
                  ...data.form_template,
                  fields: (data.form_template.fields as unknown as FormField[]) || [],
                }
              : undefined,
          });

          // Fetch profile branding for the job owner
          const { data: profileData } = await supabase
            .from('profiles')
            .select('company_name, company_logo_url, brand_color, careers_page_slug, careers_page_enabled')
            .eq('user_id', data.user_id)
            .maybeSingle();

          if (profileData) {
            setProfileBranding(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [slug]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields = job?.form_template?.fields || [];

    fields.forEach((field) => {
      if (field.required) {
        const value = formValues[field.id];
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = 'Este campo é obrigatório';
        }
      }
    });

    if (!resumeFile) {
      newErrors.resume = 'Por favor, anexe seu currículo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !validateForm()) return;

    setSubmitting(true);
    try {
      // Extract name and email from form values
      const formFields = job.form_template?.fields || [];
      const nameField = formFields.find((f) => f.label.toLowerCase().includes('nome'));
      const emailFormField = formFields.find((f) => f.type === 'email');

      const applicantName = nameField ? formValues[nameField.id] : undefined;
      const applicantEmail = emailFormField ? formValues[emailFormField.id] : undefined;

      // Check for duplicate application
      if (applicantEmail) {
        const { data: isDuplicate } = await supabase.rpc('check_duplicate_application', {
          _job_posting_id: job.id,
          _email: applicantEmail,
        });

        if (isDuplicate) {
          toast({
            title: 'Candidatura já registrada',
            description: 'Você já se candidatou para esta vaga com este e-mail.',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
      }

      // Upload resume
      let resumeUrl = '';
      if (resumeFile) {
        const fileName = `${job.id}/${crypto.randomUUID()}_${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;
        resumeUrl = fileName;
      }

      // Create application
      const { error: appError } = await supabase.from('job_applications').insert([
        {
          job_posting_id: job.id,
          form_data: formValues,
          resume_url: resumeUrl,
          resume_filename: resumeFile?.name,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
        },
      ]);

      if (appError) throw appError;

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      logActivity({
        userId: 'anonymous',
        userEmail: formValues[Object.keys(formValues).find(k => k.includes('email')) || ''] || 'unknown',
        actionType: 'application_submit_error',
        isError: true,
        metadata: { error_message: error.message, job_id: job?.id, job_title: job?.title },
      });
      toast({
        title: 'Erro ao enviar candidatura',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vaga não encontrada</h2>
            <p className="text-muted-foreground">
              Esta vaga pode ter sido removida ou o link está incorreto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (job.status !== 'active') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Candidaturas Encerradas</h2>
            <p className="text-muted-foreground">
              O período de inscrições para esta vaga foi encerrado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Candidatura Enviada!</h2>
            <p className="text-muted-foreground">
              Recebemos sua candidatura para a vaga de <strong>{job.title}</strong>.
              Entraremos em contato em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback fields when no form template is associated
  const FALLBACK_FIELDS: FormField[] = [
    { id: 'fallback_name', label: 'Nome completo', type: 'text', required: true, order: 0 },
    { id: 'fallback_email', label: 'Email', type: 'email', required: true, order: 1 },
    { id: 'fallback_phone', label: 'Telefone', type: 'phone', required: false, order: 2 },
  ];

  const fields = job.form_template?.fields?.length ? job.form_template.fields : FALLBACK_FIELDS;
  
  // Use profile branding if available, fallback to job branding for backwards compatibility
  const brandColor = profileBranding?.brand_color || job.brand_color || '#3B82F6';
  const companyName = profileBranding?.company_name || job.company_name;
  const companyLogoUrl = profileBranding?.company_logo_url || job.company_logo_url;
  const careersPageSlug = profileBranding?.careers_page_slug;
  const careersPageEnabled = profileBranding?.careers_page_enabled;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="border-b bg-card"
        style={{ borderBottomColor: brandColor }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            {companyLogoUrl ? (
              <img 
                src={companyLogoUrl} 
                alt={companyName || 'Logo'} 
                className="h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : companyName ? (
              <span 
                className="text-xl font-bold"
                style={{ color: brandColor }}
              >
                {companyName}
              </span>
            ) : (
              <img src={logoBlue} alt="Logo" className="h-8" />
            )}
          </div>
          {careersPageEnabled && careersPageSlug && (
            <a
              href={`/carreiras/${careersPageSlug}`}
              className="text-sm font-medium hover:underline"
              style={{ color: brandColor }}
            >
              Ver outras vagas
            </a>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Job Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{job.title}</CardTitle>
            {companyName && (
              <p 
                className="text-sm font-medium"
                style={{ color: brandColor }}
              >
                {companyName}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mt-2">
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
              )}
              {job.work_type && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {WORK_TYPE_LABELS[job.work_type]}
                </div>
              )}
              {job.salary_range && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary_range}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{renderFormattedText(job.description)}</div>
            {job.requirements && (
              <>
                <Separator className="my-4" />
                <h4 className="font-medium mb-2">Requisitos</h4>
                <div className="text-muted-foreground">
                  {renderFormattedText(job.requirements)}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate-se</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.length > 0 && (
                <DynamicFormRenderer
                  fields={fields}
                  values={formValues}
                  onChange={(fieldId, value) =>
                    setFormValues({ ...formValues, [fieldId]: value })
                  }
                  errors={errors}
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="resume">
                  Currículo <span className="text-destructive">*</span>
                </Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors"
                  style={{ 
                    borderColor: resumeFile ? brandColor : undefined,
                  }}
                >
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {resumeFile ? (
                      <p className="font-medium">{resumeFile.name}</p>
                    ) : (
                      <>
                        <p className="font-medium">Arraste ou clique para enviar</p>
                        <p className="text-sm text-muted-foreground">
                          PDF ou DOC, máximo 5MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
                {errors.resume && (
                  <p className="text-sm text-destructive">{errors.resume}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
                style={{ backgroundColor: brandColor }}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar Candidatura
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}