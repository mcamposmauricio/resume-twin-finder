import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobPosting, WorkType, JobStatus, FormField } from '@/types/jobs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CareersHeader } from '@/components/careers/CareersHeader';
import { CareersHero } from '@/components/careers/CareersHero';
import { CareersAbout } from '@/components/careers/CareersAbout';
import { CareersBenefits } from '@/components/careers/CareersBenefits';
import { CareersJobCard } from '@/components/careers/CareersJobCard';
import { CareersFooter } from '@/components/careers/CareersFooter';

interface CompanyProfile {
  user_id: string;
  company_name: string | null;
  company_logo_url: string | null;
  brand_color: string | null;
  company_tagline: string | null;
  company_about: string | null;
  company_culture: string | null;
  company_benefits: string[] | null;
  company_website: string | null;
  company_linkedin: string | null;
  company_instagram: string | null;
  careers_hero_image_url: string | null;
  careers_cta_text: string | null;
  careers_show_about: boolean | null;
  careers_show_benefits: boolean | null;
  careers_show_culture: boolean | null;
  careers_show_social: boolean | null;
}

export default function PublicCareers() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const jobsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            user_id, company_name, company_logo_url, brand_color,
            company_tagline, company_about, company_culture, company_benefits,
            company_website, company_linkedin, company_instagram,
            careers_hero_image_url, careers_cta_text,
            careers_show_about, careers_show_benefits, careers_show_culture, careers_show_social
          `)
          .eq('careers_page_slug', slug)
          .eq('careers_page_enabled', true)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile({
          ...profileData,
          company_benefits: (profileData.company_benefits as string[]) || [],
        });

        const { data: jobsData, error: jobsError } = await supabase
          .from('job_postings')
          .select(`*, form_template:form_templates(*)`)
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

  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))] as string[];

  const filteredJobs = jobs.filter((job) => {
    if (workTypeFilter !== 'all' && job.work_type !== workTypeFilter) return false;
    if (locationFilter !== 'all' && job.location !== locationFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = job.title.toLowerCase().includes(query);
      const matchesDescription = job.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }
    return true;
  });

  const brandColor = profile?.brand_color || '#3B82F6';

  const scrollToJobs = () => {
    jobsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
      <CareersHeader
        companyName={profile.company_name}
        companyLogoUrl={profile.company_logo_url}
        brandColor={brandColor}
        website={profile.company_website}
        linkedin={profile.company_linkedin}
        instagram={profile.company_instagram}
        showSocial={profile.careers_show_social ?? true}
      />

      <CareersHero
        companyName={profile.company_name}
        tagline={profile.company_tagline}
        heroImageUrl={profile.careers_hero_image_url}
        ctaText={profile.careers_cta_text}
        brandColor={brandColor}
        onCtaClick={scrollToJobs}
      />

      <CareersAbout
        about={profile.company_about}
        culture={profile.company_culture}
        showAbout={profile.careers_show_about ?? true}
        showCulture={profile.careers_show_culture ?? true}
        brandColor={brandColor}
      />

      <CareersBenefits
        benefits={profile.company_benefits || []}
        showBenefits={profile.careers_show_benefits ?? true}
        brandColor={brandColor}
      />

      {/* Jobs Section */}
      <section ref={jobsRef} className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            Vagas Abertas
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            {jobs.length} {jobs.length === 1 ? 'oportunidade disponível' : 'oportunidades disponíveis'}
          </p>

          {/* Filters */}
          {jobs.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vagas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Tipo" />
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
                  <SelectTrigger className="w-full sm:w-[180px]">
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
            <div className="grid md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <CareersJobCard
                  key={job.id}
                  job={job}
                  brandColor={brandColor}
                  onApply={() => navigate(`/apply/${job.public_slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CareersFooter brandColor={brandColor} />
    </div>
  );
}
