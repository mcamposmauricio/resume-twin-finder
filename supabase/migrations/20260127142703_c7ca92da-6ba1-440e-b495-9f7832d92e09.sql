-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  company_name text,
  action_type text NOT NULL,
  action_label text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert logs
CREATE POLICY "Anyone can insert logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only admin can view logs (using security definer function)
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT email FROM auth.users WHERE id = auth.uid()) = 'mauricio@marqponto.com.br'
$$;

CREATE POLICY "Only admin can view logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.is_admin_email());

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_email ON public.activity_logs(user_email);
CREATE INDEX idx_activity_logs_company_name ON public.activity_logs(company_name);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);