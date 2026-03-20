-- =====================================================
-- BC COMPLIANCE - MIGRATION PART 4: Functions, Triggers, RLS & Seed Data
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get current user's organization IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user belongs to organization
CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Auto-generate sequential codes per organization
CREATE OR REPLACE FUNCTION generate_entity_code(
    p_org_id UUID,
    p_prefix TEXT,
    p_table_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_next_num INT;
    v_code TEXT;
BEGIN
    EXECUTE format(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM ''[0-9]+$'') AS INT)), 0) + 1 FROM %I WHERE organization_id = $1',
        p_table_name
    ) INTO v_next_num USING p_org_id;

    v_code := p_prefix || '-' || LPAD(v_next_num::TEXT, 4, '0');
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- MAGERIT Risk Calculation Function
CREATE OR REPLACE FUNCTION calculate_risk_values()
RETURNS TRIGGER AS $$
DECLARE
    v_asset RECORD;
BEGIN
    -- Get asset values
    SELECT val_confidentiality, val_integrity, val_availability,
           val_authenticity, val_traceability
    INTO v_asset
    FROM assets WHERE id = NEW.asset_id;

    -- Calculate impacts: asset_value * (degradation / 100)
    NEW.impact_c := v_asset.val_confidentiality * (NEW.degradation_c::NUMERIC / 100);
    NEW.impact_i := v_asset.val_integrity * (NEW.degradation_i::NUMERIC / 100);
    NEW.impact_a := v_asset.val_availability * (NEW.degradation_a::NUMERIC / 100);
    NEW.impact_au := v_asset.val_authenticity * (NEW.degradation_au::NUMERIC / 100);
    NEW.impact_t := v_asset.val_traceability * (NEW.degradation_t::NUMERIC / 100);

    -- Max impact
    NEW.impact_max := GREATEST(NEW.impact_c, NEW.impact_i, NEW.impact_a, NEW.impact_au, NEW.impact_t);

    -- Potential risk = impact_max * frequency (normalized to 0-50 scale)
    NEW.risk_potential := NEW.impact_max * NEW.frequency;

    -- Residual risk
    NEW.risk_residual := NEW.risk_potential * (1 - NEW.safeguard_effectiveness::NUMERIC / 100);

    -- Determine inherent risk level
    NEW.risk_level_inherent := CASE
        WHEN NEW.risk_potential >= 40 THEN 'critical'::risk_level
        WHEN NEW.risk_potential >= 25 THEN 'high'::risk_level
        WHEN NEW.risk_potential >= 10 THEN 'medium'::risk_level
        WHEN NEW.risk_potential >= 3 THEN 'low'::risk_level
        ELSE 'negligible'::risk_level
    END;

    -- Determine residual risk level
    NEW.risk_level_residual := CASE
        WHEN NEW.risk_residual >= 40 THEN 'critical'::risk_level
        WHEN NEW.risk_residual >= 25 THEN 'high'::risk_level
        WHEN NEW.risk_residual >= 10 THEN 'medium'::risk_level
        WHEN NEW.risk_residual >= 3 THEN 'low'::risk_level
        ELSE 'negligible'::risk_level
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recalculate safeguard effectiveness from linked controls
CREATE OR REPLACE FUNCTION update_safeguard_effectiveness()
RETURNS TRIGGER AS $$
DECLARE
    v_effectiveness SMALLINT;
BEGIN
    SELECT COALESCE(
        LEAST(
            CAST(
                SUM(c.overall_effectiveness * crm.effectiveness) / NULLIF(SUM(crm.effectiveness), 0)
            AS SMALLINT),
            95
        ), 0)
    INTO v_effectiveness
    FROM control_risk_mappings crm
    JOIN controls c ON c.id = crm.control_id
    WHERE crm.risk_scenario_id = COALESCE(NEW.risk_scenario_id, OLD.risk_scenario_id);

    UPDATE risk_scenarios
    SET safeguard_effectiveness = v_effectiveness
    WHERE id = COALESCE(NEW.risk_scenario_id, OLD.risk_scenario_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Auto-update timestamps
-- =====================================================

CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_org_members BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_roles BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_assets BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_threat_catalog BEFORE UPDATE ON threat_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_vulnerabilities BEFORE UPDATE ON vulnerabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_risk_scenarios BEFORE UPDATE ON risk_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_treatment_plans BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_treatment_plan_actions BEFORE UPDATE ON treatment_plan_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_frameworks BEFORE UPDATE ON frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_controls BEFORE UPDATE ON controls FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_ctrl_req_mappings BEFORE UPDATE ON control_requirement_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_soa_entries BEFORE UPDATE ON soa_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_incidents BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_nonconformities BEFORE UPDATE ON nonconformities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_capa_actions BEFORE UPDATE ON capa_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_vendors BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_vendor_assessments BEFORE UPDATE ON vendor_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_evidence BEFORE UPDATE ON evidence FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_audit_programs BEFORE UPDATE ON audit_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_audit_findings BEFORE UPDATE ON audit_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_automation_rules BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_connectors BEFORE UPDATE ON integration_connectors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- MAGERIT: Recalculate risk on insert/update
CREATE TRIGGER calc_risk_on_change
    BEFORE INSERT OR UPDATE OF degradation_c, degradation_i, degradation_a, degradation_au, degradation_t, frequency, safeguard_effectiveness
    ON risk_scenarios
    FOR EACH ROW EXECUTE FUNCTION calculate_risk_values();

-- Recalculate safeguard effectiveness when control mappings change
CREATE TRIGGER update_safeguard_on_mapping_change
    AFTER INSERT OR UPDATE OR DELETE ON control_risk_mappings
    FOR EACH ROW EXECUTE FUNCTION update_safeguard_effectiveness();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Multi-tenant isolation
-- =====================================================

-- Enable RLS on ALL tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_requirement_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_risk_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE soa_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nonconformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE capa_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- Organizations: members can see their orgs
CREATE POLICY orgs_select ON organizations FOR SELECT USING (id IN (SELECT get_user_org_ids()));

-- Organization members: can see members of own orgs
CREATE POLICY org_members_select ON organization_members FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY org_members_insert ON organization_members FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY org_members_update ON organization_members FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- Roles: org members can see roles
CREATE POLICY roles_select ON roles FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY roles_insert ON roles FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY roles_update ON roles FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY roles_delete ON roles FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Generic multi-tenant policies for all org-scoped tables
-- Using a helper to create policies for tables with organization_id

-- ASSETS
CREATE POLICY assets_select ON assets FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY assets_insert ON assets FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY assets_update ON assets FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY assets_delete ON assets FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY asset_cats_select ON asset_categories FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY asset_cats_insert ON asset_categories FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY asset_deps_select ON asset_dependencies FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY asset_deps_insert ON asset_dependencies FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- THREATS (system catalog + org-specific)
CREATE POLICY threats_select ON threat_catalog FOR SELECT USING (organization_id IS NULL OR organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY threats_insert ON threat_catalog FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- VULNERABILITIES
CREATE POLICY vulns_select ON vulnerabilities FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY vulns_insert ON vulnerabilities FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY vulns_update ON vulnerabilities FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY vulns_delete ON vulnerabilities FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY asset_vulns_select ON asset_vulnerabilities FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY asset_vulns_insert ON asset_vulnerabilities FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- RISKS
CREATE POLICY risks_select ON risk_scenarios FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY risks_insert ON risk_scenarios FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY risks_update ON risk_scenarios FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY risks_delete ON risk_scenarios FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY risk_vulns_select ON risk_vulnerabilities FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY risk_vulns_insert ON risk_vulnerabilities FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- TREATMENT PLANS
CREATE POLICY tp_select ON treatment_plans FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY tp_insert ON treatment_plans FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY tp_update ON treatment_plans FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY tp_delete ON treatment_plans FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY tpa_select ON treatment_plan_actions FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY tpa_insert ON treatment_plan_actions FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY tpa_update ON treatment_plan_actions FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- FRAMEWORKS (system-level, everyone can read)
CREATE POLICY fw_select ON frameworks FOR SELECT USING (TRUE);
CREATE POLICY fw_domains_select ON framework_domains FOR SELECT USING (TRUE);
CREATE POLICY fw_reqs_select ON framework_requirements FOR SELECT USING (TRUE);
CREATE POLICY req_maps_select ON requirement_mappings FOR SELECT USING (TRUE);

-- CONTROLS
CREATE POLICY controls_select ON controls FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY controls_insert ON controls FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY controls_update ON controls FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY controls_delete ON controls FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY ctrl_req_select ON control_requirement_mappings FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY ctrl_req_insert ON control_requirement_mappings FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY ctrl_req_update ON control_requirement_mappings FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY ctrl_risk_select ON control_risk_mappings FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY ctrl_risk_insert ON control_risk_mappings FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY soa_select ON soa_entries FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY soa_insert ON soa_entries FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY soa_update ON soa_entries FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- INCIDENTS
CREATE POLICY incidents_select ON incidents FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY incidents_insert ON incidents FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY incidents_update ON incidents FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY inc_assets_select ON incident_assets FOR SELECT USING (incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY inc_timeline_select ON incident_timeline FOR SELECT USING (incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY inc_risks_select ON incident_risks FOR SELECT USING (incident_id IN (SELECT id FROM incidents WHERE organization_id IN (SELECT get_user_org_ids())));

-- NON-CONFORMITIES
CREATE POLICY nc_select ON nonconformities FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY nc_insert ON nonconformities FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY nc_update ON nonconformities FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY capa_select ON capa_actions FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY capa_insert ON capa_actions FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY capa_update ON capa_actions FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- VENDORS
CREATE POLICY vendors_select ON vendors FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY vendors_insert ON vendors FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY vendors_update ON vendors FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY vendors_delete ON vendors FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY vendor_assess_select ON vendor_assessments FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY vendor_assess_insert ON vendor_assessments FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- DOCUMENTS
CREATE POLICY docs_select ON documents FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY docs_insert ON documents FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY docs_update ON documents FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY docs_delete ON documents FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY doc_versions_select ON document_versions FOR SELECT USING (document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY evidence_select ON evidence FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY evidence_insert ON evidence FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY evidence_update ON evidence FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- AUDITS
CREATE POLICY audits_select ON audit_programs FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY audits_insert ON audit_programs FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY audits_update ON audit_programs FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY findings_select ON audit_findings FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY findings_insert ON audit_findings FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY findings_update ON audit_findings FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- AUTOMATION
CREATE POLICY rules_select ON automation_rules FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY rules_insert ON automation_rules FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY rules_update ON automation_rules FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY exec_select ON automation_executions FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

-- INTEGRATIONS
CREATE POLICY connectors_select ON integration_connectors FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY connectors_insert ON integration_connectors FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY connectors_update ON integration_connectors FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY int_events_select ON integration_events FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

-- AUDIT LOGS (read-only)
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- NOTIFICATIONS (user-scoped)
CREATE POLICY notif_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notif_update ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY notif_insert ON notifications FOR INSERT WITH CHECK (TRUE);

-- DASHBOARD METRICS
CREATE POLICY metrics_select ON dashboard_metrics FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY metrics_insert ON dashboard_metrics FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY metrics_update ON dashboard_metrics FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY metrics_delete ON dashboard_metrics FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Role permissions scoped through role's org
CREATE POLICY role_perms_select ON role_permissions FOR SELECT USING (role_id IN (SELECT id FROM roles WHERE organization_id IN (SELECT get_user_org_ids())));

-- Permissions catalog is global
CREATE POLICY perms_select ON permissions FOR SELECT USING (TRUE);

-- Treatment plan risks via treatment plan's org
CREATE POLICY tpr_select ON treatment_plan_risks FOR SELECT USING (treatment_plan_id IN (SELECT id FROM treatment_plans WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY tpr_insert ON treatment_plan_risks FOR INSERT WITH CHECK (treatment_plan_id IN (SELECT id FROM treatment_plans WHERE organization_id IN (SELECT get_user_org_ids())));

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default permissions
INSERT INTO permissions (module, action, description) VALUES
-- Dashboard
('dashboard', 'read', 'Ver dashboard principal'),
('dashboard', 'export', 'Exportar datos del dashboard'),
-- Assets
('assets', 'read', 'Ver activos'),
('assets', 'write', 'Crear y editar activos'),
('assets', 'delete', 'Eliminar activos'),
('assets', 'export', 'Exportar inventario de activos'),
-- Risks
('risks', 'read', 'Ver análisis de riesgos'),
('risks', 'write', 'Crear y editar escenarios de riesgo'),
('risks', 'delete', 'Eliminar escenarios de riesgo'),
('risks', 'approve', 'Aprobar planes de tratamiento'),
('risks', 'export', 'Exportar análisis de riesgos'),
-- Threats
('threats', 'read', 'Ver catálogo de amenazas'),
('threats', 'write', 'Gestionar amenazas personalizadas'),
-- Vulnerabilities
('vulnerabilities', 'read', 'Ver vulnerabilidades'),
('vulnerabilities', 'write', 'Gestionar vulnerabilidades'),
('vulnerabilities', 'delete', 'Eliminar vulnerabilidades'),
-- Controls
('controls', 'read', 'Ver controles'),
('controls', 'write', 'Crear y editar controles'),
('controls', 'delete', 'Eliminar controles'),
('controls', 'approve', 'Aprobar implementación de controles'),
-- Compliance
('compliance', 'read', 'Ver estado de cumplimiento'),
('compliance', 'write', 'Gestionar cumplimiento y SOA'),
('compliance', 'export', 'Exportar informes de cumplimiento'),
-- Incidents
('incidents', 'read', 'Ver incidentes'),
('incidents', 'write', 'Gestionar incidentes'),
('incidents', 'delete', 'Eliminar incidentes'),
('incidents', 'approve', 'Cerrar y aprobar incidentes'),
-- Non-conformities
('nonconformities', 'read', 'Ver no conformidades'),
('nonconformities', 'write', 'Gestionar no conformidades'),
('nonconformities', 'approve', 'Verificar y cerrar no conformidades'),
-- Vendors
('vendors', 'read', 'Ver proveedores'),
('vendors', 'write', 'Gestionar proveedores'),
('vendors', 'delete', 'Eliminar proveedores'),
('vendors', 'approve', 'Aprobar evaluaciones de proveedores'),
-- Documents
('documents', 'read', 'Ver documentos'),
('documents', 'write', 'Crear y editar documentos'),
('documents', 'delete', 'Eliminar documentos'),
('documents', 'approve', 'Aprobar y publicar documentos'),
-- Audits
('audits', 'read', 'Ver programas de auditoría'),
('audits', 'write', 'Gestionar auditorías'),
('audits', 'approve', 'Cerrar hallazgos de auditoría'),
-- Automation
('automation', 'read', 'Ver reglas de automatización'),
('automation', 'write', 'Gestionar reglas SOAR'),
-- Integrations
('integrations', 'read', 'Ver integraciones'),
('integrations', 'write', 'Configurar integraciones'),
-- Clients (multi-tenant)
('clients', 'read', 'Ver clientes'),
('clients', 'write', 'Gestionar clientes'),
-- Settings
('settings', 'read', 'Ver configuración'),
('settings', 'write', 'Modificar configuración'),
-- Reports
('reports', 'read', 'Ver informes'),
('reports', 'write', 'Generar informes'),
('reports', 'export', 'Exportar informes');

-- Insert compliance frameworks
INSERT INTO frameworks (code, name, version, description, issuing_body, category, country) VALUES
('iso27001', 'ISO/IEC 27001:2022', '2022', 'Sistema de Gestión de Seguridad de la Información', 'ISO/IEC', 'international', 'INT'),
('iso27002', 'ISO/IEC 27002:2022', '2022', 'Controles de Seguridad de la Información', 'ISO/IEC', 'international', 'INT'),
('iso27701', 'ISO/IEC 27701:2019', '2019', 'Gestión de Información de Privacidad', 'ISO/IEC', 'international', 'INT'),
('iso27032', 'ISO/IEC 27032:2023', '2023', 'Ciberseguridad', 'ISO/IEC', 'international', 'INT'),
('iso22301', 'ISO 22301:2019', '2019', 'Gestión de Continuidad de Negocio', 'ISO', 'international', 'INT'),
('nist_csf', 'NIST Cybersecurity Framework', '2.0', 'Marco de Ciberseguridad del NIST', 'NIST', 'international', 'US'),
('nis2', 'NIS2 Directive', '2022/2555', 'Directiva sobre seguridad de redes y sistemas de información', 'European Union', 'regional', 'EU'),
('pci_dss', 'PCI DSS', '4.0', 'Estándar de Seguridad de Datos de la Industria de Tarjetas de Pago', 'PCI SSC', 'industry', 'INT'),
('gdpr', 'General Data Protection Regulation', '2016/679', 'Reglamento General de Protección de Datos', 'European Union', 'regional', 'EU'),
('ley_1581', 'Ley 1581 de 2012', '2012', 'Protección de Datos Personales (Colombia)', 'Congreso de Colombia', 'national', 'CO'),
('ley_1273', 'Ley 1273 de 2009', '2009', 'Delitos Informáticos (Colombia)', 'Congreso de Colombia', 'national', 'CO'),
('decreto_1078', 'Decreto 1078 de 2015', '2015', 'Decreto Único Reglamentario del Sector TIC (Colombia)', 'Gobierno de Colombia', 'national', 'CO'),
('decreto_338', 'Decreto 338 de 2022', '2022', 'Lineamientos de Seguridad Digital (Colombia)', 'Gobierno de Colombia', 'national', 'CO');

-- Insert MAGERIT 3.0 Threat Catalog (system-level, organization_id = NULL)
INSERT INTO threat_catalog (organization_id, code, name, description, origin, affected_dimensions, affected_asset_types, frequency_base) VALUES
-- [N] Natural disasters
(NULL, 'N.1', 'Fuego', 'Incendio: posibilidad de que el fuego acabe con recursos del sistema', 'natural', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'facility', 'data']::asset_type[], 0),
(NULL, 'N.2', 'Daños por agua', 'Inundaciones: posibilidad de que el agua cause daños a los recursos del sistema', 'natural', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'facility']::asset_type[], 0),
(NULL, 'N.*', 'Desastres naturales', 'Otros desastres debidos a causas naturales: rayos, tormentas, terremotos, volcanes, etc.', 'natural', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'facility', 'network']::asset_type[], 0),
-- [I] Industrial origin
(NULL, 'I.1', 'Fuego', 'Incendio de origen industrial que puede afectar instalaciones y equipos', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'facility']::asset_type[], 1),
(NULL, 'I.2', 'Daños por agua', 'Escapes, fugas, goteras que pueden dañar equipos', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'facility']::asset_type[], 1),
(NULL, 'I.3', 'Contaminación mecánica', 'Vibraciones, polvo, suciedad que pueden dañar equipos', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware']::asset_type[], 1),
(NULL, 'I.4', 'Contaminación electromagnética', 'Interferencias de radio, campos magnéticos, luz ultravioleta', 'industrial', ARRAY['availability', 'integrity']::magerit_dimension[], ARRAY['hardware', 'network']::asset_type[], 1),
(NULL, 'I.5', 'Avería de origen físico o lógico', 'Fallos en equipos o programas que afectan la disponibilidad del sistema', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'software']::asset_type[], 2),
(NULL, 'I.6', 'Corte del suministro eléctrico', 'Cese de alimentación de potencia eléctrica', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'network', 'facility']::asset_type[], 2),
(NULL, 'I.7', 'Condiciones inadecuadas de temperatura o humedad', 'Deficiencias en la climatización de los locales', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'facility']::asset_type[], 1),
(NULL, 'I.8', 'Fallo de servicios de comunicaciones', 'Cese de capacidad de transmitir datos', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['network', 'service']::asset_type[], 2),
(NULL, 'I.9', 'Interrupción de otros servicios', 'Fallo de servicios auxiliares necesarios para el funcionamiento', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['service']::asset_type[], 2),
(NULL, 'I.10', 'Degradación de los soportes de almacenamiento', 'Deterioro de medios de almacenamiento de datos', 'industrial', ARRAY['availability', 'integrity']::magerit_dimension[], ARRAY['hardware', 'data']::asset_type[], 1),
(NULL, 'I.11', 'Emanaciones electromagnéticas', 'Emisiones electromagnéticas que permiten interceptar información', 'industrial', ARRAY['confidentiality']::magerit_dimension[], ARRAY['hardware', 'network']::asset_type[], 1),
-- [E] Errors and unintentional failures
(NULL, 'E.1', 'Errores de los usuarios', 'Equivocaciones de las personas en el uso de servicios, datos, etc.', 'defects', ARRAY['integrity', 'availability', 'confidentiality']::magerit_dimension[], ARRAY['data', 'software', 'service']::asset_type[], 3),
(NULL, 'E.2', 'Errores del administrador', 'Equivocaciones en instalación, configuración y operación del sistema', 'defects', ARRAY['integrity', 'availability', 'confidentiality']::magerit_dimension[], ARRAY['software', 'hardware', 'network']::asset_type[], 2),
(NULL, 'E.3', 'Errores de monitorización', 'Inadecuada monitorización del sistema, registros incompletos', 'defects', ARRAY['traceability', 'integrity']::magerit_dimension[], ARRAY['software', 'service']::asset_type[], 2),
(NULL, 'E.4', 'Errores de configuración', 'Configuración incorrecta del sistema o sus componentes', 'defects', ARRAY['integrity', 'availability', 'confidentiality']::magerit_dimension[], ARRAY['software', 'network', 'hardware']::asset_type[], 2),
(NULL, 'E.7', 'Deficiencias en la organización', 'Cuando no queda claro quién es responsable de qué y cómo', 'defects', ARRAY['availability', 'integrity']::magerit_dimension[], ARRAY['personnel', 'service']::asset_type[], 2),
(NULL, 'E.8', 'Difusión de software dañino', 'Propagación no intencionada de malware por usuarios', 'defects', ARRAY['availability', 'integrity', 'confidentiality']::magerit_dimension[], ARRAY['software']::asset_type[], 2),
(NULL, 'E.9', 'Errores de encaminamiento', 'Envío de información a través de un sistema o red equivocada', 'defects', ARRAY['confidentiality', 'integrity']::magerit_dimension[], ARRAY['network']::asset_type[], 1),
(NULL, 'E.10', 'Errores de secuencia', 'Alteración accidental del orden de los mensajes', 'defects', ARRAY['integrity']::magerit_dimension[], ARRAY['network', 'data']::asset_type[], 1),
(NULL, 'E.14', 'Escapes de información', 'Información disponible para personas no autorizadas', 'defects', ARRAY['confidentiality']::magerit_dimension[], ARRAY['data', 'software']::asset_type[], 2),
(NULL, 'E.15', 'Alteración accidental de la información', 'Alteración no intencionada de la información', 'defects', ARRAY['integrity']::magerit_dimension[], ARRAY['data']::asset_type[], 2),
(NULL, 'E.18', 'Destrucción de información', 'Pérdida accidental de información', 'defects', ARRAY['availability']::magerit_dimension[], ARRAY['data']::asset_type[], 2),
(NULL, 'E.19', 'Fugas de información', 'Revelación accidental de información sensible', 'defects', ARRAY['confidentiality']::magerit_dimension[], ARRAY['data', 'personnel']::asset_type[], 2),
(NULL, 'E.20', 'Vulnerabilidades de los programas', 'Defectos en el código que causan funcionamiento incorrecto', 'defects', ARRAY['integrity', 'availability', 'confidentiality']::magerit_dimension[], ARRAY['software']::asset_type[], 3),
(NULL, 'E.21', 'Errores de mantenimiento/actualización de programas', 'Defectos en los procesos de actualización de software', 'defects', ARRAY['integrity', 'availability']::magerit_dimension[], ARRAY['software']::asset_type[], 2),
(NULL, 'E.23', 'Errores de mantenimiento/actualización de equipos', 'Defectos en los procesos de mantenimiento de hardware', 'defects', ARRAY['availability']::magerit_dimension[], ARRAY['hardware']::asset_type[], 1),
(NULL, 'E.24', 'Caída del sistema por agotamiento de recursos', 'Falta de capacidad para atender la carga de trabajo', 'defects', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'software', 'network']::asset_type[], 2),
(NULL, 'E.25', 'Pérdida de equipos', 'Extravío accidental de dispositivos o soportes', 'defects', ARRAY['availability', 'confidentiality']::magerit_dimension[], ARRAY['hardware']::asset_type[], 1),
(NULL, 'E.28', 'Indisponibilidad del personal', 'Ausencia accidental del puesto de trabajo por enfermedad, etc.', 'defects', ARRAY['availability']::magerit_dimension[], ARRAY['personnel']::asset_type[], 2),
-- [A] Deliberate attacks
(NULL, 'A.3', 'Manipulación de los registros de actividad', 'Falsificación intencionada de los registros del sistema', 'deliberate', ARRAY['traceability', 'integrity']::magerit_dimension[], ARRAY['data', 'software']::asset_type[], 2),
(NULL, 'A.4', 'Manipulación de la configuración', 'Alteración intencionada de la configuración del sistema', 'deliberate', ARRAY['integrity', 'availability', 'confidentiality']::magerit_dimension[], ARRAY['software', 'network']::asset_type[], 2),
(NULL, 'A.5', 'Suplantación de la identidad del usuario', 'Cuando un atacante consigue hacerse pasar por un usuario autorizado', 'deliberate', ARRAY['confidentiality', 'integrity', 'authenticity']::magerit_dimension[], ARRAY['data', 'software', 'service']::asset_type[], 3),
(NULL, 'A.6', 'Abuso de privilegios de acceso', 'Uso indebido de privilegios por usuario autorizado', 'deliberate', ARRAY['confidentiality', 'integrity', 'traceability']::magerit_dimension[], ARRAY['data', 'software', 'service']::asset_type[], 2),
(NULL, 'A.7', 'Uso no previsto', 'Uso del sistema para fines no autorizados', 'deliberate', ARRAY['availability', 'integrity', 'confidentiality']::magerit_dimension[], ARRAY['software', 'network', 'service']::asset_type[], 2),
(NULL, 'A.8', 'Difusión de software dañino', 'Propagación intencionada de virus, gusanos, troyanos, etc.', 'deliberate', ARRAY['availability', 'integrity', 'confidentiality']::magerit_dimension[], ARRAY['software']::asset_type[], 3),
(NULL, 'A.9', 'Reencaminamiento de mensajes', 'Envío de información a un destino incorrecto a través de ruta falsa', 'deliberate', ARRAY['confidentiality', 'integrity']::magerit_dimension[], ARRAY['network']::asset_type[], 2),
(NULL, 'A.10', 'Alteración de secuencia', 'Alteración intencionada del orden de mensajes transmitidos', 'deliberate', ARRAY['integrity']::magerit_dimension[], ARRAY['network', 'data']::asset_type[], 1),
(NULL, 'A.11', 'Acceso no autorizado', 'Acceso no autorizado a componentes del sistema de información', 'deliberate', ARRAY['confidentiality', 'integrity', 'authenticity']::magerit_dimension[], ARRAY['data', 'software', 'hardware', 'network']::asset_type[], 3),
(NULL, 'A.12', 'Análisis de tráfico', 'Interceptación pasiva del tráfico de red para obtener información', 'deliberate', ARRAY['confidentiality']::magerit_dimension[], ARRAY['network']::asset_type[], 2),
(NULL, 'A.13', 'Repudio', 'Negación de acciones realizadas en el sistema', 'deliberate', ARRAY['traceability', 'authenticity']::magerit_dimension[], ARRAY['data', 'service']::asset_type[], 1),
(NULL, 'A.14', 'Interceptación de información', 'Acceso a información en tránsito por un atacante', 'deliberate', ARRAY['confidentiality']::magerit_dimension[], ARRAY['network', 'data']::asset_type[], 2),
(NULL, 'A.15', 'Modificación deliberada de la información', 'Alteración intencionada de la información', 'deliberate', ARRAY['integrity']::magerit_dimension[], ARRAY['data']::asset_type[], 2),
(NULL, 'A.18', 'Destrucción de información', 'Eliminación intencionada de información', 'deliberate', ARRAY['availability']::magerit_dimension[], ARRAY['data']::asset_type[], 2),
(NULL, 'A.19', 'Divulgación de información', 'Revelación deliberada de información confidencial', 'deliberate', ARRAY['confidentiality']::magerit_dimension[], ARRAY['data', 'personnel']::asset_type[], 2),
(NULL, 'A.22', 'Manipulación de programas', 'Alteración intencionada del funcionamiento de los programas', 'deliberate', ARRAY['integrity', 'availability', 'confidentiality']::magerit_dimension[], ARRAY['software']::asset_type[], 2),
(NULL, 'A.23', 'Manipulación de los equipos', 'Alteración intencionada del funcionamiento de los equipos', 'deliberate', ARRAY['availability', 'integrity', 'confidentiality']::magerit_dimension[], ARRAY['hardware']::asset_type[], 1),
(NULL, 'A.24', 'Denegación de servicio', 'Degradación intencionada de la disponibilidad del sistema', 'deliberate', ARRAY['availability']::magerit_dimension[], ARRAY['network', 'software', 'service']::asset_type[], 3),
(NULL, 'A.25', 'Robo', 'Sustracción de equipos, soportes o documentos', 'deliberate', ARRAY['availability', 'confidentiality']::magerit_dimension[], ARRAY['hardware', 'data']::asset_type[], 1),
(NULL, 'A.26', 'Ataque destructivo', 'Vandalismo, terrorismo, acción militar contra instalaciones', 'deliberate', ARRAY['availability']::magerit_dimension[], ARRAY['hardware', 'facility']::asset_type[], 0),
(NULL, 'A.27', 'Ocupación enemiga', 'Toma de control de instalaciones por personal hostil', 'deliberate', ARRAY['availability', 'integrity', 'confidentiality']::magerit_dimension[], ARRAY['facility']::asset_type[], 0),
(NULL, 'A.28', 'Indisponibilidad del personal', 'Ausencia deliberada del puesto de trabajo', 'deliberate', ARRAY['availability']::magerit_dimension[], ARRAY['personnel']::asset_type[], 1),
(NULL, 'A.29', 'Extorsión', 'Presión sobre el personal para obtener beneficios indebidos', 'deliberate', ARRAY['confidentiality', 'integrity']::magerit_dimension[], ARRAY['personnel']::asset_type[], 1),
(NULL, 'A.30', 'Ingeniería social', 'Manipulación de personas para obtener información o acceso', 'deliberate', ARRAY['confidentiality', 'integrity', 'authenticity']::magerit_dimension[], ARRAY['personnel']::asset_type[], 3);
