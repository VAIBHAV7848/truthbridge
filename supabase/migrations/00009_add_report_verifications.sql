-- ============================================================
-- TruthBridge — Report Verification System
-- Allows citizens to confirm/validate reports filed by others
-- ============================================================

-- Table to track verifications (citizens confirming reports)
CREATE TABLE report_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  citizen_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bridge_id         UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  verified_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes             TEXT, -- Optional notes about the verification
  
  -- Prevent duplicate verifications by same citizen on same report
  UNIQUE(report_id, citizen_id)
);

-- Add verification count to reports for quick access
ALTER TABLE reports 
  ADD COLUMN verification_count INT NOT NULL DEFAULT 0,
  ADD COLUMN last_verified_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX idx_verifications_report_id ON report_verifications (report_id);
CREATE INDEX idx_verifications_citizen_id ON report_verifications (citizen_id);
CREATE INDEX idx_verifications_bridge_id ON report_verifications (bridge_id);
CREATE INDEX idx_reports_verification_count ON reports (verification_count DESC);

-- Function to update verification count on reports
CREATE OR REPLACE FUNCTION update_report_verification_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports 
    SET verification_count = verification_count + 1,
        last_verified_at = NEW.verified_at
    WHERE id = NEW.report_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports 
    SET verification_count = verification_count - 1
    WHERE id = OLD.report_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update counts
CREATE TRIGGER trg_update_verification_count
  AFTER INSERT OR DELETE ON report_verifications
  FOR EACH ROW EXECUTE FUNCTION update_report_verification_count();

-- RLS Policies
ALTER TABLE report_verifications ENABLE ROW LEVEL SECURITY;

-- Anyone can read verifications (public validation counts)
CREATE POLICY "verifications_public_read"
  ON report_verifications FOR SELECT
  USING (true);

-- Authenticated users can add verifications (but not their own reports)
CREATE POLICY "verifications_citizen_insert"
  ON report_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    citizen_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_id
      AND r.citizen_id != auth.uid() -- Can't verify your own report
    )
  );

-- Users can delete their own verifications
CREATE POLICY "verifications_citizen_delete"
  ON report_verifications FOR DELETE
  TO authenticated
  USING (citizen_id = auth.uid());
