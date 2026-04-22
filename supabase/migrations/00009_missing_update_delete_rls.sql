-- ═══════════════════════════════════════════════════════════════════════════
-- Añadir policies UPDATE/DELETE faltantes en 33 tablas multi-tenant
--
-- Problema detectado: RLS activa pero sin policies UPDATE/DELETE → postgres
-- rechaza las escrituras silenciosamente (0 rows affected, sin error).
-- Esto causaba que TODOS los formularios de edición y botones de eliminar
-- fallaran silenciosamente. Síntoma que lo delató: upload de archivo a
-- documents subía al Storage pero el campo file_path nunca se actualizaba.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t TEXT;
  org_tables TEXT[] := ARRAY[
    'asset_categories','asset_dependencies','asset_vulnerabilities','assets',
    'audit_findings','audit_logs','audit_programs',
    'automation_executions','automation_rules',
    'capa_actions',
    'control_requirement_mappings','control_risk_mappings','controls',
    'dashboard_metrics',
    'documents','evidence',
    'incidents','integration_connectors','integration_events',
    'invitations','nonconformities','notifications',
    'risk_scenarios','risk_vulnerabilities',
    'soa_entries',
    'treatment_plan_actions','treatment_plans',
    'vendor_assessments','vendors','vulnerabilities'
  ];
BEGIN
  FOREACH t IN ARRAY org_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids())) WITH CHECK (organization_id IN (SELECT get_user_org_ids()))',
      t || '_update', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()))',
      t || '_delete', t
    );
  END LOOP;
END $$;

-- Tablas sin organization_id directo (scope via FK al padre)

-- incident_assets
DROP POLICY IF EXISTS incident_assets_select ON incident_assets;
DROP POLICY IF EXISTS incident_assets_insert ON incident_assets;
DROP POLICY IF EXISTS incident_assets_update ON incident_assets;
DROP POLICY IF EXISTS incident_assets_delete ON incident_assets;
CREATE POLICY incident_assets_select ON incident_assets FOR SELECT USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_assets_insert ON incident_assets FOR INSERT WITH CHECK (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_assets_update ON incident_assets FOR UPDATE USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_assets_delete ON incident_assets FOR DELETE USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));

-- incident_risks
DROP POLICY IF EXISTS incident_risks_select ON incident_risks;
DROP POLICY IF EXISTS incident_risks_insert ON incident_risks;
DROP POLICY IF EXISTS incident_risks_update ON incident_risks;
DROP POLICY IF EXISTS incident_risks_delete ON incident_risks;
CREATE POLICY incident_risks_select ON incident_risks FOR SELECT USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_risks_insert ON incident_risks FOR INSERT WITH CHECK (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_risks_update ON incident_risks FOR UPDATE USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_risks_delete ON incident_risks FOR DELETE USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));

-- incident_timeline
DROP POLICY IF EXISTS incident_timeline_select ON incident_timeline;
DROP POLICY IF EXISTS incident_timeline_insert ON incident_timeline;
DROP POLICY IF EXISTS incident_timeline_update ON incident_timeline;
DROP POLICY IF EXISTS incident_timeline_delete ON incident_timeline;
CREATE POLICY incident_timeline_select ON incident_timeline FOR SELECT USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_timeline_insert ON incident_timeline FOR INSERT WITH CHECK (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_timeline_update ON incident_timeline FOR UPDATE USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY incident_timeline_delete ON incident_timeline FOR DELETE USING (
  incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));

-- treatment_plan_risks
DROP POLICY IF EXISTS treatment_plan_risks_select ON treatment_plan_risks;
DROP POLICY IF EXISTS treatment_plan_risks_insert ON treatment_plan_risks;
DROP POLICY IF EXISTS treatment_plan_risks_update ON treatment_plan_risks;
DROP POLICY IF EXISTS treatment_plan_risks_delete ON treatment_plan_risks;
CREATE POLICY treatment_plan_risks_select ON treatment_plan_risks FOR SELECT USING (
  treatment_plan_id IN (SELECT id FROM treatment_plans WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY treatment_plan_risks_insert ON treatment_plan_risks FOR INSERT WITH CHECK (
  treatment_plan_id IN (SELECT id FROM treatment_plans WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY treatment_plan_risks_update ON treatment_plan_risks FOR UPDATE USING (
  treatment_plan_id IN (SELECT id FROM treatment_plans WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY treatment_plan_risks_delete ON treatment_plan_risks FOR DELETE USING (
  treatment_plan_id IN (SELECT id FROM treatment_plans WHERE organization_id IN (SELECT get_user_org_ids())));

-- document_versions
DROP POLICY IF EXISTS document_versions_select ON document_versions;
DROP POLICY IF EXISTS document_versions_insert ON document_versions;
DROP POLICY IF EXISTS document_versions_update ON document_versions;
DROP POLICY IF EXISTS document_versions_delete ON document_versions;
CREATE POLICY document_versions_select ON document_versions FOR SELECT USING (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY document_versions_insert ON document_versions FOR INSERT WITH CHECK (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY document_versions_update ON document_versions FOR UPDATE USING (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY document_versions_delete ON document_versions FOR DELETE USING (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));
