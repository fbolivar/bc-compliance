-- =============================================================
-- MIGRATION 014: DAFP risk fields (hybrid MAGERIT + DAFP 2020)
-- =============================================================
-- Adds the fields required to cover the DAFP (Departamento Administrativo
-- de la Función Pública) risk model that Colombian public entities must
-- use (Decreto 2106/2019 + MIPG). We keep the existing MAGERIT fields for
-- quantitative analysis and add the DAFP labels + zones on top.
--
-- Also: allow risk_scenarios to be linked to a PROCESS (via category_id)
-- in addition to a specific asset. DAFP risks are often process-centric.
-- =============================================================

-- 1. Allow risk to live at process level (not just per-asset)
ALTER TABLE risk_scenarios
  ALTER COLUMN asset_id DROP NOT NULL;

ALTER TABLE risk_scenarios
  ADD COLUMN IF NOT EXISTS category_id UUID
    REFERENCES asset_categories(id) ON DELETE SET NULL;

-- At least one scope must be set
ALTER TABLE risk_scenarios DROP CONSTRAINT IF EXISTS chk_risk_scope;
ALTER TABLE risk_scenarios
  ADD CONSTRAINT chk_risk_scope CHECK (
    asset_id IS NOT NULL OR category_id IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_risks_category
  ON risk_scenarios (organization_id, category_id);

-- 2. DAFP-specific fields on risk_scenarios
ALTER TABLE risk_scenarios
  ADD COLUMN IF NOT EXISTS causes TEXT,
  ADD COLUMN IF NOT EXISTS consequences TEXT,
  ADD COLUMN IF NOT EXISTS risk_type TEXT,
  ADD COLUMN IF NOT EXISTS activity_frequency INT,
  ADD COLUMN IF NOT EXISTS probability_label TEXT,
  ADD COLUMN IF NOT EXISTS probability_value NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS impact_label TEXT,
  ADD COLUMN IF NOT EXISTS impact_value NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS risk_zone TEXT;

COMMENT ON COLUMN risk_scenarios.probability_label IS
  'DAFP probability level (5-point scale): Muy Baja, Baja, Media, Alta, Muy Alta.';
COMMENT ON COLUMN risk_scenarios.impact_label IS
  'DAFP impact level (5-point scale): Leve, Menor, Moderado, Mayor, Catastrófico.';
COMMENT ON COLUMN risk_scenarios.risk_zone IS
  'DAFP inherent risk zone (from the 5x5 matrix): Bajo, Moderado, Alto, Extremo.';

-- 3. DAFP-specific attributes on controls
ALTER TABLE controls
  ADD COLUMN IF NOT EXISTS affects_probability_or_impact TEXT,
  ADD COLUMN IF NOT EXISTS is_documented BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_evidence BOOLEAN,
  ADD COLUMN IF NOT EXISTS control_frequency_dafp TEXT;

COMMENT ON COLUMN controls.affects_probability_or_impact IS
  'DAFP control attribute: whether the control reduces Probability or Impact.';
COMMENT ON COLUMN controls.is_documented IS
  'DAFP control attribute: whether the control activity is formally documented.';
COMMENT ON COLUMN controls.has_evidence IS
  'DAFP control attribute: whether execution leaves a traceable record.';
COMMENT ON COLUMN controls.control_frequency_dafp IS
  'DAFP control frequency (distinct from execution_frequency which is free text).';
