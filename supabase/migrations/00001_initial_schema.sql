-- ============================================================
-- TruthBridge — Initial Schema Migration
-- Supabase / PostgreSQL
-- Translates MongoDB PRD entities into normalized Postgres.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Custom ENUM types
-- ────────────────────────────────────────────────────────────

CREATE TYPE bridge_status AS ENUM ('SAFE', 'MONITOR', 'WARNING', 'CRITICAL');
CREATE TYPE damage_type   AS ENUM ('CRACK', 'SCOUR', 'RAILING_BROKEN', 'OVERLOADING', 'FOUNDATION', 'SPALLING', 'OTHER');
CREATE TYPE severity      AS ENUM ('VISIBLE', 'SERIOUS', 'DANGEROUS');
CREATE TYPE report_status  AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'IGNORED');
CREATE TYPE authority_role AS ENUM ('PWD_ENGINEER', 'HDMC_OFFICER', 'STATE_AUTHORITY', 'SUPER_ADMIN');
CREATE TYPE alert_type     AS ENUM ('RISK_SCORE_HIGH', 'MONSOON_SPIKE', 'INSPECTION_OVERDUE', 'REPORT_CRITICAL', 'AUTO_ESCALATED');
CREATE TYPE inspection_type AS ENUM ('PRE_MONSOON', 'POST_MONSOON', 'SPECIAL', 'ROUTINE');
CREATE TYPE overall_condition AS ENUM ('GOOD', 'FAIR', 'POOR', 'CRITICAL');
CREATE TYPE seismic_zone   AS ENUM ('II', 'III', 'IV', 'V', 'VI');

-- ────────────────────────────────────────────────────────────
-- 1. authorities  (admin / government users)
--    Links to auth.users via auth_user_id.
-- ────────────────────────────────────────────────────────────

CREATE TABLE authorities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  role            authority_role NOT NULL DEFAULT 'PWD_ENGINEER',
  jurisdiction    JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"state":"Karnataka","districts":["Dharwad","Hubballi","Belagavi"]}
  department      TEXT,
  contact_phone   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  total_actioned  INT NOT NULL DEFAULT 0,
  total_ignored   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. bridges
-- ────────────────────────────────────────────────────────────

CREATE TABLE bridges (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,

  -- location (flattened from nested Mongo doc)
  lat                     DOUBLE PRECISION NOT NULL,
  lng                     DOUBLE PRECISION NOT NULL,
  district                TEXT,
  state                   TEXT,
  address                 TEXT,

  -- structural details
  year_built              INT,
  age                     INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM now())::INT - year_built) STORED,
  bridge_type             TEXT,              -- "RCC Slab", "PSC Girder", etc.
  length_m                NUMERIC(10,2),
  width_m                 NUMERIC(10,2),
  design_load             TEXT,              -- "IRC Class A"
  material                TEXT,

  seismic_zone            seismic_zone,
  responsible_authority   TEXT,              -- display name
  authority_id            UUID REFERENCES authorities(id) ON DELETE SET NULL,

  last_inspection_date    DATE,
  last_inspection_report  TEXT,              -- storage URL

  -- risk scoring
  risk_score              INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_breakdown          JSONB NOT NULL DEFAULT '{}',
  -- {"age_factor":22,"citizen_reports":20,"inspection_gap":18,"monsoon_risk":17,"seismic_zone":10}

  status                  bridge_status NOT NULL DEFAULT 'SAFE',
  total_reports           INT NOT NULL DEFAULT 0,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. reports  (citizen submissions)
-- ────────────────────────────────────────────────────────────

CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id         UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  bridge_name       TEXT,                                 -- denormalized for quick reads

  reporter_hash     TEXT,                                 -- anonymous IP hash
  photo_url         TEXT,                                 -- Supabase Storage URL
  photo_path        TEXT,                                 -- Storage path for deletion

  damage_type       damage_type NOT NULL,
  severity          severity NOT NULL,
  description       TEXT,

  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,

  status            report_status NOT NULL DEFAULT 'PENDING',

  -- authority response (flattened from nested Mongo doc)
  responded_by      UUID REFERENCES authorities(id) ON DELETE SET NULL,
  response_status   TEXT,
  response_notes    TEXT,
  proof_photo_url   TEXT,
  responded_at      TIMESTAMPTZ,

  days_unaddressed  INT NOT NULL DEFAULT 0,
  auto_escalated_at TIMESTAMPTZ,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. inspections
-- ────────────────────────────────────────────────────────────

CREATE TABLE inspections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id             UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  conducted_by          UUID REFERENCES authorities(id) ON DELETE SET NULL,
  inspector_name        TEXT,
  inspection_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  inspection_type       inspection_type NOT NULL DEFAULT 'ROUTINE',

  findings              JSONB NOT NULL DEFAULT '{}',
  -- {"overall_condition":"POOR","crack_width_mm":2.3,"scour_depth_m":0.8,
  --  "bearing_condition":"WORN","railing_condition":"DAMAGED",
  --  "foundation_condition":"FAIR","notes":"..."}

  irc_compliance_score  INT CHECK (irc_compliance_score BETWEEN 0 AND 100),
  report_pdf_url        TEXT,                -- Supabase Storage URL
  report_pdf_path       TEXT,                -- Storage path
  next_inspection_due   DATE,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. alerts
-- ────────────────────────────────────────────────────────────

CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id       UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  bridge_name     TEXT,
  authority_id    UUID REFERENCES authorities(id) ON DELETE SET NULL,
  alert_type      alert_type NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  -- {"risk_score":87,"trigger":"monsoon_rainfall_spike","rainfall_mm":142}
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. truth_counter  (single-row reference table)
-- ────────────────────────────────────────────────────────────

CREATE TABLE truth_counter (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Government official data
  official_collapses       INT NOT NULL DEFAULT 42,
  official_source          TEXT DEFAULT 'MoRTH Parliamentary Response 2024',
  official_source_url      TEXT,

  -- Media / citizen reality data
  reality_collapses        INT NOT NULL DEFAULT 170,
  reality_deaths           INT NOT NULL DEFAULT 202,
  reality_injured          INT NOT NULL DEFAULT 441,
  reality_source           TEXT DEFAULT 'Newslaundry Media Analysis July 2025',
  citizen_reports_on_platform INT NOT NULL DEFAULT 0,

  gap                      INT GENERATED ALWAYS AS (reality_collapses - official_collapses) STORED,

  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 7. Indexes  (only real query-path indexes)
-- ────────────────────────────────────────────────────────────

-- Bridges — map queries & sorting
CREATE INDEX idx_bridges_location     ON bridges (lat, lng);
CREATE INDEX idx_bridges_risk_score   ON bridges (risk_score DESC);
CREATE INDEX idx_bridges_status       ON bridges (status);
CREATE INDEX idx_bridges_state_dist   ON bridges (state, district);

-- Reports — per-bridge lookup & filtering
CREATE INDEX idx_reports_bridge_id    ON reports (bridge_id);
CREATE INDEX idx_reports_status       ON reports (status);
CREATE INDEX idx_reports_created_at   ON reports (created_at DESC);
CREATE INDEX idx_reports_severity     ON reports (severity);

-- Authorities — login lookup
CREATE INDEX idx_authorities_email    ON authorities (email);

-- Alerts — admin panel
CREATE INDEX idx_alerts_authority     ON alerts (authority_id, is_read);
CREATE INDEX idx_alerts_created_at    ON alerts (created_at DESC);

-- Inspections
CREATE INDEX idx_inspections_bridge   ON inspections (bridge_id);

-- ────────────────────────────────────────────────────────────
-- 8. Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE bridges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_counter ENABLE ROW LEVEL SECURITY;

-- ── Bridges ──────────────────────────────────────────────────

-- Anyone can read bridges (public map)
CREATE POLICY "bridges_public_read"
  ON bridges FOR SELECT
  USING (true);

-- Only authenticated admins can insert/update/delete
CREATE POLICY "bridges_admin_insert"
  ON bridges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
    )
  );

CREATE POLICY "bridges_admin_update"
  ON bridges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
    )
  );

CREATE POLICY "bridges_admin_delete"
  ON bridges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
        AND authorities.role = 'SUPER_ADMIN'
    )
  );

-- ── Reports ──────────────────────────────────────────────────

-- Public reports are readable by everyone
CREATE POLICY "reports_public_read"
  ON reports FOR SELECT
  USING (is_public = true);

-- Anyone (including anon) can insert a report — citizen reporting
CREATE POLICY "reports_citizen_insert"
  ON reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can update report status
CREATE POLICY "reports_admin_update"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
    )
  );

-- ── Authorities ──────────────────────────────────────────────

-- Admins can read their own profile
CREATE POLICY "authorities_self_read"
  ON authorities FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Super admins can read all authorities
CREATE POLICY "authorities_superadmin_read"
  ON authorities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities a
      WHERE a.auth_user_id = auth.uid()
        AND a.role = 'SUPER_ADMIN'
    )
  );

-- Super admins can manage authorities
CREATE POLICY "authorities_superadmin_manage"
  ON authorities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities a
      WHERE a.auth_user_id = auth.uid()
        AND a.role = 'SUPER_ADMIN'
    )
  );

-- ── Inspections ──────────────────────────────────────────────

-- Public read for inspection history
CREATE POLICY "inspections_public_read"
  ON inspections FOR SELECT
  USING (true);

-- Only admins can insert inspections
CREATE POLICY "inspections_admin_insert"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
    )
  );

CREATE POLICY "inspections_admin_update"
  ON inspections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
    )
  );

-- ── Alerts ───────────────────────────────────────────────────

-- Admins can read their own alerts
CREATE POLICY "alerts_admin_read"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    authority_id IN (
      SELECT id FROM authorities
      WHERE auth_user_id = auth.uid()
    )
  );

-- System (service role) creates alerts; admins can mark read
CREATE POLICY "alerts_admin_update"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    authority_id IN (
      SELECT id FROM authorities
      WHERE auth_user_id = auth.uid()
    )
  );

-- ── Truth Counter ────────────────────────────────────────────

-- Everyone can read the truth counter
CREATE POLICY "truth_counter_public_read"
  ON truth_counter FOR SELECT
  USING (true);

-- Only service role (server-side) should update truth counter.
-- No authenticated-user update policy — updates go through Edge Functions.

-- ────────────────────────────────────────────────────────────
-- 9. Helper function: auto-update updated_at
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bridges_updated_at
  BEFORE UPDATE ON bridges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_authorities_updated_at
  BEFORE UPDATE ON authorities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_truth_counter_updated_at
  BEFORE UPDATE ON truth_counter
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
