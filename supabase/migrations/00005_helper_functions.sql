-- ============================================================
-- TruthBridge — Helper Functions
-- ============================================================

-- Bulk update days_unaddressed for all pending/under_review reports
-- Used by the auto-escalation Edge Function for O(1) performance
CREATE OR REPLACE FUNCTION bulk_update_days_unaddressed()
RETURNS void LANGUAGE sql AS $$
  UPDATE reports
  SET days_unaddressed = EXTRACT(DAY FROM now() - created_at)::int
  WHERE status IN ('PENDING', 'UNDER_REVIEW');
$$;
