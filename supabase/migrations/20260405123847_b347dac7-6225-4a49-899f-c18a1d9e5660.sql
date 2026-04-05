
-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications (lower(applicant_email));
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON public.job_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id ON public.job_applications (job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_triage ON public.job_applications (triage_status);

-- Aggregated talent pool function
CREATE OR REPLACE FUNCTION public.get_talent_pool(
  p_user_id uuid,
  p_search text DEFAULT NULL,
  p_job_ids uuid[] DEFAULT NULL,
  p_triage_status text DEFAULT NULL,
  p_has_resume boolean DEFAULT NULL,
  p_min_applications int DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 50
)
RETURNS TABLE(
  email text,
  name text,
  phone text,
  total_applications bigint,
  latest_date timestamptz,
  latest_job_title text,
  latest_job_posting_id uuid,
  latest_triage text,
  latest_status text,
  has_resume boolean,
  latest_resume_url text,
  latest_resume_filename text,
  score int,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total bigint;
BEGIN
  -- Count total matching records first
  SELECT COUNT(*) INTO v_total
  FROM (
    SELECT lower(ja.applicant_email) AS em
    FROM job_applications ja
    INNER JOIN job_postings jp ON jp.id = ja.job_posting_id
    WHERE jp.user_id = p_user_id
      AND ja.applicant_email IS NOT NULL
      AND ja.applicant_email != ''
      -- Search filter: name, email, phone in form_data
      AND (p_search IS NULL OR p_search = '' OR
        lower(ja.applicant_email) LIKE '%' || lower(p_search) || '%' OR
        lower(COALESCE(ja.applicant_name, '')) LIKE '%' || lower(p_search) || '%' OR
        lower(COALESCE(ja.form_data->>'Nome completo', ja.form_data->>'nome_completo', ja.form_data->>'name', '')) LIKE '%' || lower(p_search) || '%' OR
        lower(COALESCE(ja.form_data->>'Telefone', ja.form_data->>'telefone', ja.form_data->>'phone', '')) LIKE '%' || lower(p_search) || '%'
      )
      -- Job filter
      AND (p_job_ids IS NULL OR ja.job_posting_id = ANY(p_job_ids))
      -- Triage filter
      AND (p_triage_status IS NULL OR p_triage_status = '' OR ja.triage_status = p_triage_status)
    GROUP BY lower(ja.applicant_email)
    HAVING
      -- Has resume filter
      (p_has_resume IS NULL OR p_has_resume = bool_or(ja.resume_url IS NOT NULL AND ja.resume_url != ''))
      -- Min applications filter
      AND (p_min_applications IS NULL OR COUNT(*) >= p_min_applications)
      -- Date from filter
      AND (p_date_from IS NULL OR MAX(ja.created_at) >= p_date_from)
  ) sub;

  RETURN QUERY
  WITH talent_agg AS (
    SELECT
      lower(ja.applicant_email) AS t_email,
      MAX(COALESCE(
        ja.form_data->>'Nome completo',
        ja.form_data->>'nome_completo',
        ja.form_data->>'name',
        ja.applicant_name,
        split_part(ja.applicant_email, '@', 1)
      )) AS t_name,
      MAX(COALESCE(
        ja.form_data->>'Telefone',
        ja.form_data->>'telefone',
        ja.form_data->>'phone'
      )) AS t_phone,
      COUNT(*)::bigint AS t_total,
      MAX(ja.created_at) AS t_latest_date,
      bool_or(ja.resume_url IS NOT NULL AND ja.resume_url != '') AS t_has_resume,
      -- Score calculation
      (
        -- Recency score (0-40)
        CASE
          WHEN MAX(ja.created_at) >= now() - interval '7 days' THEN 40
          WHEN MAX(ja.created_at) >= now() - interval '30 days' THEN 25
          WHEN MAX(ja.created_at) >= now() - interval '90 days' THEN 10
          ELSE 0
        END
        +
        -- Frequency score (0-30)
        CASE
          WHEN COUNT(*) >= 3 THEN 30
          WHEN COUNT(*) = 2 THEN 20
          ELSE 10
        END
        +
        -- Best triage score (0-30)
        CASE
          WHEN bool_or(ja.triage_status = 'deserves_analysis') THEN 30
          WHEN bool_or(ja.triage_status = 'new') THEN 15
          ELSE 0
        END
      )::int AS t_score
    FROM job_applications ja
    INNER JOIN job_postings jp ON jp.id = ja.job_posting_id
    WHERE jp.user_id = p_user_id
      AND ja.applicant_email IS NOT NULL
      AND ja.applicant_email != ''
      AND (p_search IS NULL OR p_search = '' OR
        lower(ja.applicant_email) LIKE '%' || lower(p_search) || '%' OR
        lower(COALESCE(ja.applicant_name, '')) LIKE '%' || lower(p_search) || '%' OR
        lower(COALESCE(ja.form_data->>'Nome completo', ja.form_data->>'nome_completo', ja.form_data->>'name', '')) LIKE '%' || lower(p_search) || '%' OR
        lower(COALESCE(ja.form_data->>'Telefone', ja.form_data->>'telefone', ja.form_data->>'phone', '')) LIKE '%' || lower(p_search) || '%'
      )
      AND (p_job_ids IS NULL OR ja.job_posting_id = ANY(p_job_ids))
      AND (p_triage_status IS NULL OR p_triage_status = '' OR ja.triage_status = p_triage_status)
    GROUP BY lower(ja.applicant_email)
    HAVING
      (p_has_resume IS NULL OR p_has_resume = bool_or(ja.resume_url IS NOT NULL AND ja.resume_url != ''))
      AND (p_min_applications IS NULL OR COUNT(*) >= p_min_applications)
      AND (p_date_from IS NULL OR MAX(ja.created_at) >= p_date_from)
  ),
  latest_apps AS (
    SELECT DISTINCT ON (lower(ja.applicant_email))
      lower(ja.applicant_email) AS l_email,
      jp.title AS l_job_title,
      ja.job_posting_id AS l_job_posting_id,
      ja.triage_status AS l_triage,
      ja.status AS l_status,
      ja.resume_url AS l_resume_url,
      ja.resume_filename AS l_resume_filename
    FROM job_applications ja
    INNER JOIN job_postings jp ON jp.id = ja.job_posting_id
    WHERE jp.user_id = p_user_id
      AND ja.applicant_email IS NOT NULL
      AND ja.applicant_email != ''
    ORDER BY lower(ja.applicant_email), ja.created_at DESC
  )
  SELECT
    ta.t_email,
    ta.t_name,
    ta.t_phone,
    ta.t_total,
    ta.t_latest_date,
    la.l_job_title,
    la.l_job_posting_id,
    la.l_triage,
    la.l_status,
    ta.t_has_resume,
    la.l_resume_url,
    la.l_resume_filename,
    ta.t_score,
    v_total
  FROM talent_agg ta
  LEFT JOIN latest_apps la ON la.l_email = ta.t_email
  ORDER BY ta.t_score DESC, ta.t_latest_date DESC
  OFFSET ((p_page - 1) * p_page_size)
  LIMIT p_page_size;
END;
$$;

-- Function to get talent detail (applications for a specific email)
CREATE OR REPLACE FUNCTION public.get_talent_applications(
  p_user_id uuid,
  p_email text
)
RETURNS TABLE(
  id uuid,
  job_posting_id uuid,
  job_title text,
  job_status text,
  triage_status text,
  status text,
  created_at timestamptz,
  resume_url text,
  resume_filename text,
  form_data jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    ja.id,
    ja.job_posting_id,
    jp.title AS job_title,
    jp.status AS job_status,
    ja.triage_status,
    ja.status,
    ja.created_at,
    ja.resume_url,
    ja.resume_filename,
    ja.form_data
  FROM job_applications ja
  INNER JOIN job_postings jp ON jp.id = ja.job_posting_id
  WHERE jp.user_id = p_user_id
    AND lower(ja.applicant_email) = lower(p_email)
  ORDER BY ja.created_at DESC;
$$;
