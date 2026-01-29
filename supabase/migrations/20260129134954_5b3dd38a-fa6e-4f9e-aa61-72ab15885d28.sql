-- Adicionar coluna is_blocked na tabela profiles
ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Função RPC para admin gerenciar perfis de usuários (adicionar tokens e bloquear)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  _target_user_id uuid, 
  _resumes_to_add integer DEFAULT NULL,
  _set_blocked boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_email() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  IF _resumes_to_add IS NOT NULL THEN
    UPDATE profiles 
    SET total_resumes = total_resumes + _resumes_to_add
    WHERE user_id = _target_user_id;
  END IF;
  
  IF _set_blocked IS NOT NULL THEN
    UPDATE profiles 
    SET is_blocked = _set_blocked
    WHERE user_id = _target_user_id;
  END IF;
END;
$$;

-- Função para verificar se usuário está bloqueado (usada pelo Edge Function)
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_blocked FROM profiles WHERE user_id = _user_id),
    false
  )
$$;

-- Função para admin buscar todos os usuários com estatísticas
CREATE OR REPLACE FUNCTION public.admin_get_users_with_stats()
RETURNS TABLE (
  user_id uuid,
  email text,
  name text,
  company_name text,
  phone text,
  cargo text,
  total_resumes integer,
  is_blocked boolean,
  created_at timestamptz,
  role text,
  total_analyses bigint,
  total_tokens_used bigint,
  resumes_analyzed bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_email() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.name,
    p.company_name,
    p.phone,
    p.cargo,
    p.total_resumes,
    p.is_blocked,
    p.created_at,
    ur.role::text,
    COUNT(a.id)::bigint as total_analyses,
    COALESCE(SUM(a.tokens_used), 0)::bigint as total_tokens_used,
    COALESCE(SUM(jsonb_array_length(a.candidates)), 0)::bigint as resumes_analyzed
  FROM profiles p
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id
  LEFT JOIN analyses a ON a.user_id = p.user_id AND a.status = 'completed'
  GROUP BY p.user_id, p.email, p.name, p.company_name, 
           p.phone, p.cargo, p.total_resumes, p.is_blocked,
           p.created_at, ur.role
  ORDER BY p.created_at DESC;
END;
$$;