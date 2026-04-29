-- ============================================================
-- TruthBridge — Age Detection for Reports
-- Stores AI-detected age group from submitted photos
-- ============================================================

ALTER TABLE reports
  ADD COLUMN detected_age_group TEXT,
  ADD COLUMN age_detection_confidence REAL;

COMMENT ON COLUMN reports.detected_age_group IS 'AI-detected age group: Child 0-12, Teenager 13-20, Adult 21-44, Middle Age 45-64, Aged 65+';
COMMENT ON COLUMN reports.age_detection_confidence IS 'Confidence score (0-1) for the detected age group';

CREATE INDEX idx_reports_age_group ON reports (detected_age_group) WHERE detected_age_group IS NOT NULL;