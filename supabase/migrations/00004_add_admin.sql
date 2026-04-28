-- ============================================================
-- TruthBridge — Add Super Admin
-- ============================================================
-- ⚠️ DEMO SEED DATA — Remove before production deployment
-- Replace email/password with real admin credentials in Supabase Dashboard

-- Ensure the user is in the authorities table to grant Admin Dashboard access

INSERT INTO authorities (
  auth_user_id,
  name,
  email,
  role,
  department
) VALUES (
  '2ff2c5ff-992d-4dce-813f-67d3ce15d344',
  'Vaibhav Chavan Patil',
  'chavanpatilvaibhav395@gmail.com',
  'SUPER_ADMIN',
  'TruthBridge Administration'
)
ON CONFLICT (email) DO NOTHING;
