import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobPosting, WorkType, JobStatus, FormField } from '@/types/jobs';
import { WORK_TYPE_LABELS } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import logoBlue from '@/assets/logo-marq-blue.png';

interface CompanyProfile {
  user_id: string;
  company_name: string | null;
  company_logo_url: string | null;
  brand_color: string | null;
}

export default function PublicCareers() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch profile by careers page slug
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, company_name, company_logo_url, brand_color')
          .eq('careers_page_slug', slug)
          .eq('careers_page_enabled', true)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        // Fetch active jobs for this user
        const { data: jobsData, error: jobsError } = await supabase
          .from('job_postings')
          .select(`
            *,
            form_template:form_templates(*)
          `)
          .eq('user_id', profileData.user_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;

        const parsedJobs: JobPosting[] = (jobsData || []).map((j) => ({
          ...j,
          work_type: j.work_type as WorkType | undefined,
          status: j.status as JobStatus,
          form_template: j.form_template
            ? {
                ...j.form_template,
                fields: (j.form_template.fields as unknown as FormField[]) || [],
              }
            : undefined,
        }));

        setJobs(parsedJobs);
      } catch (error) {
        console.error('Error fetching careers data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Get unique locations for filter
  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))] as string[];

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (workTypeFilter !== 'all' && job.work_type !== workTypeFilter) return false;
    if (locationFilter !== 'all' && job.location !== locationFilter) return false;
    return true;
  });

  const brandColor = profile?.brand_color || '#3B82F6';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Página não encontrada</h2>
            <p className="text-muted-foreground">
              Esta página de carreiras não existe ou está desativada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="border-b bg-card"
        style={{ borderBottomColor: brandColor }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {profile.company_logo_url ? (
              <img
                src={profile.company_logo_url}
                alt={profile.company_name || 'Logo'}
                className="h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : profile.company_name ? (
              <span className="text-2xl font-bold" style={{ color: brandColor }}>
                {profile.company_name}
              </span>
            ) : (
              <img src={logoBlue} alt="Logo" className="h-10" />
            )}
            <span className="text-lg font-medium text-muted-foreground">
              Trabalhe Conosco
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Junte-se ao time {profile.company_name || ''}!
          </h1>
          <p className="text-muted-foreground">
            Confira nossas vagas abertas e faça parte da nossa equipe
          </p>
        </div>

        {/* Filters */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de trabalho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="remote">Remoto</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
                <SelectItem value="onsite">Presencial</SelectItem>
              </SelectContent>
            </Select>

            {locations.length > 0 && (
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Localização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas localidades</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {jobs.length === 0
                  ? 'Nenhuma vaga disponível no momento'
                  : 'Nenhuma vaga corresponde aos filtros'}
              </h3>
              <p className="text-muted-foreground">
                {jobs.length === 0
                  ? 'Volte em breve para conferir novas oportunidades!'
                  : 'Tente ajustar os filtros para ver mais vagas.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {job.description}
                  </p>
                  <Button
                    onClick={() => navigate(`/apply/${job.public_slug}`)}
                    style={{ backgroundColor: brandColor }}
                  >
                    Candidatar-se
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Powered by{' '}
          <a
            href="https://marqponto.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
            style={{ color: brandColor }}
          >
            CompareCV powered by MarQ
          </a>
        </div>
      </div>
    </div>
  );
}
