-- Workflow de aprobación SOA + auditoría de cambios
ALTER TABLE soa_entries
  ADD COLUMN IF NOT EXISTS pending_status TEXT,
  ADD COLUMN IF NOT EXISTS pending_compliance_status TEXT,
  ADD COLUMN IF NOT EXISTS pending_justification TEXT,
  ADD COLUMN IF NOT EXISTS pending_changed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS pending_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_soa_pending ON soa_entries(organization_id) WHERE pending_status IS NOT NULL;

CREATE TABLE IF NOT EXISTS soa_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  soa_entry_id UUID NOT NULL REFERENCES soa_entries(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_type TEXT NOT NULL CHECK (change_type IN ('proposed','approved','rejected','reverted')),
  old_implementation_status TEXT,
  new_implementation_status TEXT,
  old_compliance_status TEXT,
  new_compliance_status TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_soa_change_log_entry ON soa_change_log(soa_entry_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_soa_change_log_org ON soa_change_log(organization_id, changed_at DESC);

ALTER TABLE soa_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS soa_change_log_select ON soa_change_log;
DROP POLICY IF EXISTS soa_change_log_insert ON soa_change_log;
CREATE POLICY soa_change_log_select ON soa_change_log FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY soa_change_log_insert ON soa_change_log FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
