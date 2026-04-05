
-- Add new social media columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS company_whatsapp text,
  ADD COLUMN IF NOT EXISTS company_youtube text,
  ADD COLUMN IF NOT EXISTS company_tiktok text,
  ADD COLUMN IF NOT EXISTS company_glassdoor text;

-- Create company-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for company-assets bucket: authenticated users can upload
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- Users can view all company assets (public bucket)
CREATE POLICY "Public can view company assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- Users can update their own uploads
CREATE POLICY "Users can update own company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
