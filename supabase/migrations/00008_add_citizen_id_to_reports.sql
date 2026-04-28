-- ============================================================
-- TruthBridge — Add citizen_id to reports for user tracking
-- ============================================================

ALTER TABLE reports
  ADD COLUMN citizen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_reports_citizen_id ON reports (citizen_id);
