-- Snapshots históricos diarios del dashboard ejecutivo
CREATE TABLE IF NOT EXISTS dashboard_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  capture_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mspi_score SMALLINT NOT NULL DEFAULT 0,
  phva_planear SMALLINT NOT NULL DEFAULT 0,
  phva_hacer SMALLINT NOT NULL DEFAULT 0,
  phva_verificar SMALLINT NOT NULL DEFAULT 0,
  phva_actuar SMALLINT NOT NULL DEFAULT 0,
  total_risks INT NOT NULL DEFAULT 0,
  critical_risks INT NOT NULL DEFAULT 0,
  high_risks INT NOT NULL DEFAULT 0,
  total_controls INT NOT NULL DEFAULT 0,
  implemented_controls INT NOT NULL DEFAULT 0,
  total_incidents INT NOT NULL DEFAULT 0,
  active_incidents INT NOT NULL DEFAULT 0,
  total_vulns INT NOT NULL DEFAULT 0,
  open_vulns INT NOT NULL DEFAULT 0,
  critical_vulns INT NOT NULL DEFAULT 0,
  total_ncs INT NOT NULL DEFAULT 0,
  open_ncs INT NOT NULL DEFAULT 0,
  overdue_ncs INT NOT NULL DEFAULT 0,
  avg_compliance SMALLINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(organization_id, capture_date)
);

CREATE INDEX IF NOT EXISTS idx_dms_org_date ON dashboard_metrics_snapshots(organization_id, capture_date DESC);

ALTER TABLE dashboard_metrics_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dms_select ON dashboard_metrics_snapshots;
DROP POLICY IF EXISTS dms_insert ON dashboard_metrics_snapshots;
DROP POLICY IF EXISTS dms_update ON dashboard_metrics_snapshots;
CREATE POLICY dms_select ON dashboard_metrics_snapshots FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY dms_insert ON dashboard_metrics_snapshots FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY dms_update ON dashboard_metrics_snapshots FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- RPC para obtener emails de miembros activos de una org
CREATE OR REPLACE FUNCTION get_user_emails_in_org(p_org_id UUID)
RETURNS TABLE(email TEXT)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT au.email::TEXT
  FROM organization_members om
  JOIN auth.users au ON au.id = om.user_id
  WHERE om.organization_id = p_org_id
    AND om.is_active = TRUE
    AND au.email IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION get_user_emails_in_org(UUID) TO authenticated, service_role;
