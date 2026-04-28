-- ============================================================
-- TruthBridge — Seed Data (5 Hubballi-Dharwad Demo Bridges)
-- Run AFTER initial schema migration.
-- ============================================================

-- ── Truth Counter (single row) ───────────────────────────────

INSERT INTO truth_counter (
  official_collapses, official_source, official_source_url,
  reality_collapses, reality_deaths, reality_injured, reality_source,
  citizen_reports_on_platform
) VALUES (
  42,
  'MoRTH Parliamentary Response 2024',
  'https://data.gov.in/resource/bridge-collapse-data',
  170,
  202,
  441,
  'Newslaundry Media Analysis July 2025',
  0
);

-- ── Demo Bridges ─────────────────────────────────────────────

INSERT INTO bridges (
  name, lat, lng, district, state, address,
  year_built, bridge_type, length_m, width_m, design_load, material,
  seismic_zone, responsible_authority,
  last_inspection_date,
  risk_score, risk_breakdown, status, total_reports
) VALUES
(
  'Dharwad Bypass Bridge',
  15.4589, 75.0078, 'Dharwad', 'Karnataka', 'NH-48 Bypass, Dharwad',
  1979, 'RCC T-Beam', 180.00, 7.50, 'IRC Class A', 'Reinforced Concrete',
  'III', 'Karnataka PWD',
  '2022-08-01',
  88,
  '{"age_factor":22,"citizen_reports":20,"inspection_gap":18,"monsoon_risk":18,"seismic_zone":10}',
  'CRITICAL',
  4
),
(
  'Tungabhadra NH Bridge',
  15.3647, 76.4600, 'Koppal', 'Karnataka', 'NH-50, Tungabhadra River',
  1991, 'PSC Girder', 320.00, 10.00, 'IRC Class AA', 'Pre-stressed Concrete',
  'II', 'NHAI Karnataka',
  '2024-03-10',
  45,
  '{"age_factor":15,"citizen_reports":4,"inspection_gap":5,"monsoon_risk":13,"seismic_zone":2}',
  'MONITOR',
  1
),
(
  'Hubli Railway Overbridge',
  15.3647, 75.1240, 'Hubballi', 'Karnataka', 'Station Road, Hubballi',
  2003, 'Steel Composite', 120.00, 12.00, 'IRC Class A', 'Steel + Concrete',
  'III', 'Indian Railways / HDMC',
  '2025-09-15',
  28,
  '{"age_factor":8,"citizen_reports":0,"inspection_gap":0,"monsoon_risk":7,"seismic_zone":5}',
  'SAFE',
  0
),
(
  'Malaprabha River Bridge NH-67',
  15.7749, 74.9643, 'Dharwad', 'Karnataka', 'NH-67, Malaprabha River',
  1968, 'RCC Arch', 200.00, 6.50, 'IRC Class B', 'Reinforced Concrete',
  'III', 'Karnataka PWD',
  '2021-06-20',
  94,
  '{"age_factor":25,"citizen_reports":21,"inspection_gap":20,"monsoon_risk":17,"seismic_zone":5}',
  'CRITICAL',
  6
),
(
  'Belagavi NH-4 Bridge',
  15.8497, 74.4977, 'Belagavi', 'Karnataka', 'NH-4, Krishna River',
  1985, 'RCC Slab', 240.00, 7.50, 'IRC Class A', 'Reinforced Concrete',
  'III', 'Karnataka PWD',
  '2023-11-05',
  62,
  '{"age_factor":22,"citizen_reports":8,"inspection_gap":12,"monsoon_risk":13,"seismic_zone":5}',
  'WARNING',
  2
);

-- ── Demo Reports (for the two CRITICAL bridges) ──────────────

-- Reports for Dharwad Bypass Bridge
INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_d1a4', 'CRACK', 'DANGEROUS',
       'Large crack visible on pier #2, approximately 4cm wide. Concrete spalling around crack edges.',
       b.lat, b.lng, 'IGNORED', 18, now() - interval '18 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_e7b2', 'SPALLING', 'SERIOUS',
       'Concrete spalling visible on underside of deck slab near midspan.',
       b.lat, b.lng, 'PENDING', 45, now() - interval '45 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_f3c9', 'FOUNDATION', 'SERIOUS',
       'Water seepage observed near abutment foundation. Soil erosion visible.',
       b.lat, b.lng, 'UNDER_REVIEW', 67, now() - interval '67 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_a1d0', 'RAILING_BROKEN', 'VISIBLE',
       'Railing damaged on south side, approximately 3m section missing.',
       b.lat, b.lng, 'ACTION_TAKEN', 0, now() - interval '90 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

-- Reports for Malaprabha River Bridge
INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_b5e1', 'CRACK', 'DANGEROUS',
       'Multiple cracks on pier #3 and pier #5. Reinforcement bars exposed.',
       b.lat, b.lng, 'IGNORED', 42, now() - interval '42 days'
FROM bridges b WHERE b.name = 'Malaprabha River Bridge NH-67';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_c8f3', 'SCOUR', 'DANGEROUS',
       'Heavy scour observed around pier #1 foundation. River erosion deepening.',
       b.lat, b.lng, 'PENDING', 25, now() - interval '25 days'
FROM bridges b WHERE b.name = 'Malaprabha River Bridge NH-67';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_d2a7', 'CRACK', 'SERIOUS',
       'Longitudinal crack along deck slab. Visible from below.',
       b.lat, b.lng, 'PENDING', 14, now() - interval '14 days'
FROM bridges b WHERE b.name = 'Malaprabha River Bridge NH-67';

-- Report for Belagavi NH-4 Bridge
INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_e9c1', 'OVERLOADING', 'SERIOUS',
       'Heavy trucks well above weight limit regularly crossing. Visible sagging observed.',
       b.lat, b.lng, 'UNDER_REVIEW', 10, now() - interval '10 days'
FROM bridges b WHERE b.name = 'Belagavi NH-4 Bridge';
