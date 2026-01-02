-- VS-44: Reports Storage Bucket
-- Creates storage bucket for Executive Report PDFs

-- Create storage bucket for reports (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760,  -- 10MB max file size
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Users can only access their own reports
-- Storage path format: {user_id}/{run_id}/executive_report_{timestamp}.pdf
CREATE POLICY "Users can access own reports"
ON storage.objects FOR ALL
USING (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for uploading reports (server-side via service role bypasses this)
CREATE POLICY "Users can upload own reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for downloading reports
CREATE POLICY "Users can download own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
