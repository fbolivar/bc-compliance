-- Allow org members to create org-scoped threats (INSERT was missing from
-- the original RLS, blocking the DAFP risk importer from auto-creating
-- threats that are outside the MAGERIT base catalog).

DROP POLICY IF EXISTS threats_insert ON threat_catalog;
CREATE POLICY threats_insert ON threat_catalog FOR INSERT
    WITH CHECK (
        organization_id IS NOT NULL
        AND organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );
