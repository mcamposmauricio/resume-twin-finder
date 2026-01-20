-- =============================================
-- FORM TEMPLATES TABLE
-- =============================================
CREATE TABLE public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own form templates"
ON public.form_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own form templates"
ON public.form_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form templates"
ON public.form_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own form templates"
ON public.form_templates FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- JOB POSTINGS TABLE
-- =============================================
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  location TEXT,
  salary_range TEXT,
  work_type TEXT CHECK (work_type IN ('remote', 'hybrid', 'onsite')),
  form_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  public_slug TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Users can manage their own job postings"
ON public.job_postings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public can view active postings (for apply page)
CREATE POLICY "Public can view active job postings"
ON public.job_postings FOR SELECT
USING (status = 'active');

-- =============================================
-- JOB APPLICATIONS TABLE
-- =============================================
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  resume_url TEXT,
  resume_filename TEXT,
  applicant_email TEXT,
  applicant_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'analyzed')),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Job owners can view applications
CREATE POLICY "Users can view applications for their jobs"
ON public.job_applications FOR SELECT
USING (
  job_posting_id IN (SELECT id FROM public.job_postings WHERE user_id = auth.uid())
);

-- Job owners can update applications
CREATE POLICY "Users can update applications for their jobs"
ON public.job_applications FOR UPDATE
USING (
  job_posting_id IN (SELECT id FROM public.job_postings WHERE user_id = auth.uid())
);

-- Public can apply to active jobs only
CREATE POLICY "Public can apply to active jobs"
ON public.job_applications FOR INSERT
WITH CHECK (
  job_posting_id IN (SELECT id FROM public.job_postings WHERE status = 'active')
);

-- =============================================
-- STORAGE BUCKET FOR RESUMES
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Anyone can upload resumes (for public apply page)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Job owners can read resumes for their job postings
CREATE POLICY "Job owners can read resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.job_postings jp ON ja.job_posting_id = jp.id
    WHERE jp.user_id = auth.uid()
    AND (storage.foldername(name))[1] = jp.id::text
  )
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_form_templates_updated_at
BEFORE UPDATE ON public.form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_form_templates_user_id ON public.form_templates(user_id);
CREATE INDEX idx_job_postings_user_id ON public.job_postings(user_id);
CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_postings_public_slug ON public.job_postings(public_slug);
CREATE INDEX idx_job_applications_job_posting_id ON public.job_applications(job_posting_id);
CREATE INDEX idx_job_applications_analysis_id ON public.job_applications(analysis_id);