-- ============================================================
-- TruthBridge — Storage Buckets & Policies
-- ============================================================

-- 1. Report Photos  — citizens upload damage photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,                                     -- publicly readable (shown on map)
  5242880,                                  -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 2. Proof Photos   — authorities upload repair proof
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof-photos',
  'proof-photos',
  true,                                     -- publicly readable (accountability)
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 3. Inspection PDFs — authorities upload inspection reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-pdfs',
  'inspection-pdfs',
  true,                                     -- publicly readable for transparency
  10485760,                                 -- 10 MB max
  ARRAY['application/pdf']
);

-- ────────────────────────────────────────────────────────────
-- Storage RLS Policies
-- ────────────────────────────────────────────────────────────

-- report-photos: anyone can upload (citizen reporting), everyone can read
CREATE POLICY "report_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

CREATE POLICY "report_photos_anon_upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'report-photos');

-- proof-photos: only admins upload, everyone reads
CREATE POLICY "proof_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-photos');

CREATE POLICY "proof_photos_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proof-photos'
    AND EXISTS (
      SELECT 1 FROM public.authorities
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- inspection-pdfs: only admins upload, everyone reads
CREATE POLICY "inspection_pdfs_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-pdfs');

CREATE POLICY "inspection_pdfs_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inspection-pdfs'
    AND EXISTS (
      SELECT 1 FROM public.authorities
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );
