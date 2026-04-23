-- =============================================================
-- MIGRATION 013: Process Dependencies + dependency ↔ asset pivot
-- =============================================================
-- Dependencies are organizational units (Oficinas, Grupos, Áreas,
-- Subdirecciones, etc.) that live UNDER a specific process
-- (asset_categories row where parent_id IS NOT NULL).
--
-- Hierarchy:  Familia → Proceso → Dependencia → Activo
--
-- An asset can be linked to multiple dependencies (many-to-many).
--
-- NOTE: pivot is named `dependency_assets` to avoid colliding with
-- the existing `asset_dependencies` table (which models parent/child
-- TECHNICAL dependencies between assets, unrelated to this feature).
-- =============================================================

CREATE TABLE IF NOT EXISTS process_dependencies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    process_id      UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    kind            TEXT NOT NULL DEFAULT 'Dependencia',
    description     TEXT,
    sort_order      INT DEFAULT 0,
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (organization_id, process_id, name)
);

CREATE INDEX IF NOT EXISTS idx_process_dependencies_org
    ON process_dependencies (organization_id);
CREATE INDEX IF NOT EXISTS idx_process_dependencies_process
    ON process_dependencies (process_id);

COMMENT ON TABLE process_dependencies IS
    'Organizational units (oficinas, grupos, áreas, subdirecciones) under a process. Hierarchy: Familia → Proceso → Dependencia → Activo.';
COMMENT ON COLUMN process_dependencies.kind IS
    'Free-form label for the unit type: "Oficina", "Grupo", "Área", "Subdirección", "Dirección Territorial", "Unidad", etc.';

-- Dependency ↔ Asset pivot (many-to-many)
CREATE TABLE IF NOT EXISTS dependency_assets (
    dependency_id   UUID NOT NULL REFERENCES process_dependencies(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (dependency_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_dependency_assets_asset
    ON dependency_assets (asset_id);
CREATE INDEX IF NOT EXISTS idx_dependency_assets_dep
    ON dependency_assets (dependency_id);
CREATE INDEX IF NOT EXISTS idx_dependency_assets_org
    ON dependency_assets (organization_id);

COMMENT ON TABLE dependency_assets IS
    'Pivot linking dependencies to one or more assets. An asset can live in multiple organizational units.';

-- =============================================================
-- RLS: org members can do CRUD on rows of their own org
-- =============================================================

ALTER TABLE process_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_assets ENABLE ROW LEVEL SECURITY;

-- process_dependencies
DROP POLICY IF EXISTS pd_select ON process_dependencies;
CREATE POLICY pd_select ON process_dependencies FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
    ));

DROP POLICY IF EXISTS pd_insert ON process_dependencies;
CREATE POLICY pd_insert ON process_dependencies FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
    ));

DROP POLICY IF EXISTS pd_update ON process_dependencies;
CREATE POLICY pd_update ON process_dependencies FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
    ));

DROP POLICY IF EXISTS pd_delete ON process_dependencies;
CREATE POLICY pd_delete ON process_dependencies FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
    ));

-- dependency_assets (pivot)
DROP POLICY IF EXISTS da_select ON dependency_assets;
CREATE POLICY da_select ON dependency_assets FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
    ));

DROP POLICY IF EXISTS da_insert ON dependency_assets;
CREATE POLICY da_insert ON dependency_assets FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
    ));

DROP POLICY IF EXISTS da_delete ON dependency_assets;
CREATE POLICY da_delete ON dependency_assets FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
    ));

-- updated_at trigger on process_dependencies
CREATE OR REPLACE FUNCTION trg_process_dependencies_touch()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_process_dependencies ON process_dependencies;
CREATE TRIGGER touch_process_dependencies
    BEFORE UPDATE ON process_dependencies
    FOR EACH ROW EXECUTE FUNCTION trg_process_dependencies_touch();
