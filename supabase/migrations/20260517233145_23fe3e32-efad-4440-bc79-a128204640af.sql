
-- Create private bucket for system exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-exports', 'system-exports', false)
ON CONFLICT (id) DO NOTHING;

-- No public policies — only service_role can access. Downloads via signed URLs.
