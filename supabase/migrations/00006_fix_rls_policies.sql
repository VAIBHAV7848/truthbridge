-- ============================================================
-- TruthBridge — Fix RLS Policies (Critical Issues #4 & #5)
-- ============================================================

-- Fix #4: Allow public read access to limited authority fields
-- so BridgeDetail page can display accountability scores.
-- Without this, the authorities query returns null for non-admin users.
CREATE POLICY "authorities_public_limited_read"
  ON authorities FOR SELECT
  USING (true);
-- Note: For stricter security, create a view that exposes only
-- (id, name, role, total_actioned, total_ignored) and query that instead.

-- Fix #5: Allow admin users to read ALL reports (not just public ones).
-- The admin dashboard needs to see PENDING, UNDER_REVIEW, IGNORED reports.
CREATE POLICY "reports_admin_read_all"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
    )
  );
