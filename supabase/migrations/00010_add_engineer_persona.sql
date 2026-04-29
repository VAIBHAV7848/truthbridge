-- Engineer persona + task assignment system

-- ENUMs (safe creation - check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engineer_task_status') THEN
    CREATE TYPE engineer_task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engineer_task_priority') THEN
    CREATE TYPE engineer_task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
END $$;

-- engineers table (mirrors structure of authorities)
CREATE TABLE IF NOT EXISTS engineers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  employee_id     TEXT,
  specialization  TEXT,   -- e.g. "Structural", "Geotechnical", "Hydraulic"
  department      TEXT,
  contact_phone   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- engineer_tasks table
CREATE TABLE IF NOT EXISTS engineer_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id         UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  bridge_name       TEXT,                          -- denormalized
  report_id         UUID REFERENCES reports(id) ON DELETE SET NULL,  -- optional link to a citizen report
  assigned_by       UUID NOT NULL REFERENCES authorities(id) ON DELETE CASCADE,
  assigned_to       UUID NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  priority          engineer_task_priority NOT NULL DEFAULT 'MEDIUM',
  status            engineer_task_status NOT NULL DEFAULT 'OPEN',
  due_date          DATE,
  completion_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

-- Indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_engineers_auth_user ON engineers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_engineers_active ON engineers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON engineer_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON engineer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_bridge ON engineer_tasks(bridge_id);

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_engineers_updated ON engineers;
CREATE TRIGGER trg_engineers_updated
  BEFORE UPDATE ON engineers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_engineer_tasks_updated ON engineer_tasks;
CREATE TRIGGER trg_engineer_tasks_updated
  BEFORE UPDATE ON engineer_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for engineers table
ALTER TABLE engineers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Engineers can view own profile" ON engineers;
DROP POLICY IF EXISTS "Admins can view all engineers" ON engineers;
DROP POLICY IF EXISTS "Only super admins can insert engineers" ON engineers;
DROP POLICY IF EXISTS "Only super admins can update engineers" ON engineers;

-- Engineers can read their own profile
CREATE POLICY "Engineers can view own profile"
  ON engineers FOR SELECT
  USING (auth_user_id = auth.uid());

-- Admins can view all engineers (for assignment dropdowns)
CREATE POLICY "Admins can view all engineers"
  ON engineers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = TRUE
    )
  );

-- Only super admins can insert/update engineers
CREATE POLICY "Only super admins can insert engineers"
  ON engineers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.role = 'SUPER_ADMIN'
        AND authorities.is_active = TRUE
    )
  );

CREATE POLICY "Only super admins can update engineers"
  ON engineers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.role = 'SUPER_ADMIN'
        AND authorities.is_active = TRUE
    )
  );

-- RLS Policies for engineer_tasks table
ALTER TABLE engineer_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Engineers can view own tasks" ON engineer_tasks;
DROP POLICY IF EXISTS "Admins can view tasks they assigned" ON engineer_tasks;
DROP POLICY IF EXISTS "Admins can create tasks" ON engineer_tasks;
DROP POLICY IF EXISTS "Engineers can update own tasks" ON engineer_tasks;
DROP POLICY IF EXISTS "Admins can update tasks they assigned" ON engineer_tasks;

-- Engineers can view tasks assigned to them
CREATE POLICY "Engineers can view own tasks"
  ON engineer_tasks FOR SELECT
  USING (
    assigned_to IN (
      SELECT id FROM engineers WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view tasks they assigned
CREATE POLICY "Admins can view tasks they assigned"
  ON engineer_tasks FOR SELECT
  USING (
    assigned_by IN (
      SELECT id FROM authorities WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can create tasks
CREATE POLICY "Admins can create tasks"
  ON engineer_tasks FOR INSERT
  WITH CHECK (
    assigned_by IN (
      SELECT id FROM authorities WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Engineers can update their own tasks (status, completion notes)
CREATE POLICY "Engineers can update own tasks"
  ON engineer_tasks FOR UPDATE
  USING (
    assigned_to IN (
      SELECT id FROM engineers WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can update tasks they created
CREATE POLICY "Admins can update tasks they assigned"
  ON engineer_tasks FOR UPDATE
  USING (
    assigned_by IN (
      SELECT id FROM authorities WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

COMMENT ON TABLE engineers IS 'Field engineers who perform bridge inspections and repairs';
COMMENT ON TABLE engineer_tasks IS 'Tasks assigned by authorities to engineers for bridge inspection/repair';
