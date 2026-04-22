-- Cross-framework requirement_mappings is a GLOBAL catalog (no org_id).
-- SELECT is already open to all authenticated users. Writes should be restricted
-- to members of the platform-owner organization only.

CREATE OR REPLACE FUNCTION is_platform_owner_member()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = auth.uid()
      AND om.is_active = true
      AND o.is_platform_owner = true
  );
$$;

GRANT EXECUTE ON FUNCTION is_platform_owner_member() TO authenticated;

-- Drop old policies if they exist (idempotent)
DROP POLICY IF EXISTS req_maps_insert ON requirement_mappings;
DROP POLICY IF EXISTS req_maps_update ON requirement_mappings;
DROP POLICY IF EXISTS req_maps_delete ON requirement_mappings;

-- Platform-owner-only write policies
CREATE POLICY req_maps_insert ON requirement_mappings
  FOR INSERT
  WITH CHECK (is_platform_owner_member());

CREATE POLICY req_maps_update ON requirement_mappings
  FOR UPDATE
  USING (is_platform_owner_member())
  WITH CHECK (is_platform_owner_member());

CREATE POLICY req_maps_delete ON requirement_mappings
  FOR DELETE
  USING (is_platform_owner_member());
