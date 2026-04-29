-- ============================================================
-- TruthBridge — Age Detection for Reports
-- Stores AI-detected age group from submitted photos
-- ============================================================

ALTER TABLE reports
  ADD COLUMN detected_age_group TEXT,
  ADD COLUMN age_detection_confidence REAL;

COMMENT ON COLUMN reports.detected_age_group IS 'AI-detected bridge construction era: Pre-1950, 1950-1970, 1970-1990, 1990-2010, 2010+';
COMMENT ON COLUMN reports.age_detection_confidence IS 'Confidence score (0-1) for the detected age group';

CREATE INDEX idx_reports_age_group ON reports (detected_age_group) WHERE detected_age_group IS NOT NULL;