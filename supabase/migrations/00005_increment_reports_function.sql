-- ============================================================
-- TruthBridge — Add increment_bridge_reports function
-- ============================================================

-- Create the RPC function to increment total_reports on bridges
CREATE OR REPLACE FUNCTION increment_bridge_reports(bridge_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE bridges
  SET total_reports = total_reports + 1
  WHERE id = bridge_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;