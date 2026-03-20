#!/bin/bash
# Apply BC Compliance migrations to Supabase via curl
API="https://api.supabase.com/v1/projects/pqboameuqyvszvsrqxiv/database/query"
TOKEN="sbp_fc49a4206aac45c1302630039a0ee77fa1b7ac01"

run_sql() {
  local desc="$1"
  local sql="$2"
  local result=$(curl -s -w "\n%{http_code}" -X POST "$API" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $sql}")
  local http_code=$(echo "$result" | tail -1)
  if [ "$http_code" = "200" ]; then
    echo "  OK: $desc"
  else
    echo "  FAIL ($http_code): $desc"
    echo "  Response: $(echo "$result" | head -1)"
  fi
}

echo "============================================"
echo "SECTION 1: Core Platform Tables"
echo "============================================"

run_sql "organizations" '"CREATE TABLE organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, tax_id TEXT, industry TEXT, country TEXT DEFAULT '\''CO'\'', address TEXT, logo_url TEXT, plan org_plan DEFAULT '\''starter'\'', max_users INT DEFAULT 5, max_assets INT DEFAULT 100, settings JSONB DEFAULT '\''{}'\''::jsonb, is_active BOOLEAN DEFAULT TRUE, trial_ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "profiles" '"CREATE TABLE profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT NOT NULL, full_name TEXT, avatar_url TEXT, phone TEXT, job_title TEXT, department TEXT, status user_status DEFAULT '\''active'\'', mfa_enabled BOOLEAN DEFAULT FALSE, last_login_at TIMESTAMPTZ, preferences JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "organization_members" '"CREATE TABLE organization_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, role_id UUID, is_owner BOOLEAN DEFAULT FALSE, joined_at TIMESTAMPTZ DEFAULT now() NOT NULL, invited_by UUID REFERENCES profiles(id), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, user_id))"'

run_sql "idx_org_members" '"CREATE INDEX idx_org_members_org ON organization_members(organization_id); CREATE INDEX idx_org_members_user ON organization_members(user_id)"'

run_sql "roles" '"CREATE TABLE roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, is_system_role BOOLEAN DEFAULT FALSE, permissions JSONB NOT NULL DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, name))"'

run_sql "fk_org_members_role" '"ALTER TABLE organization_members ADD CONSTRAINT fk_org_members_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL"'

run_sql "permissions" '"CREATE TABLE permissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), module TEXT NOT NULL, action TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(module, action))"'

run_sql "role_permissions" '"CREATE TABLE role_permissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE, permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, conditions JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(role_id, permission_id))"'

echo ""
echo "============================================"
echo "SECTION 2: Asset Management (CMDB)"
echo "============================================"

run_sql "asset_categories" '"CREATE TABLE asset_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, parent_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL, icon TEXT, sort_order INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "assets" '"CREATE TABLE assets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, asset_type asset_type NOT NULL, category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL, status asset_status DEFAULT '\''active'\'', criticality asset_criticality DEFAULT '\''medium'\'', owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL, custodian_id UUID REFERENCES profiles(id) ON DELETE SET NULL, department TEXT, location TEXT, val_confidentiality SMALLINT DEFAULT 0 CHECK (val_confidentiality BETWEEN 0 AND 10), val_integrity SMALLINT DEFAULT 0 CHECK (val_integrity BETWEEN 0 AND 10), val_availability SMALLINT DEFAULT 0 CHECK (val_availability BETWEEN 0 AND 10), val_authenticity SMALLINT DEFAULT 0 CHECK (val_authenticity BETWEEN 0 AND 10), val_traceability SMALLINT DEFAULT 0 CHECK (val_traceability BETWEEN 0 AND 10), ip_address INET, hostname TEXT, mac_address MACADDR, operating_system TEXT, software_version TEXT, serial_number TEXT, manufacturer TEXT, model TEXT, acquisition_date DATE, warranty_expiry DATE, end_of_life DATE, disposal_date DATE, is_critical BOOLEAN DEFAULT FALSE, data_classification TEXT, pii_data BOOLEAN DEFAULT FALSE, financial_data BOOLEAN DEFAULT FALSE, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "idx_assets" '"CREATE INDEX idx_assets_org ON assets(organization_id); CREATE INDEX idx_assets_type ON assets(organization_id, asset_type); CREATE INDEX idx_assets_status ON assets(organization_id, status); CREATE INDEX idx_assets_criticality ON assets(organization_id, criticality); CREATE INDEX idx_assets_owner ON assets(owner_id)"'

run_sql "asset_dependencies" '"CREATE TABLE asset_dependencies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, parent_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, child_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, dependency_type TEXT DEFAULT '\''depends_on'\'', description TEXT, is_critical BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(parent_asset_id, child_asset_id), CHECK(parent_asset_id != child_asset_id))"'

echo ""
echo "============================================"
echo "SECTION 3: MAGERIT Risk Model"
echo "============================================"

run_sql "threat_catalog" '"CREATE TABLE threat_catalog (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, origin threat_origin NOT NULL, affected_dimensions magerit_dimension[] NOT NULL, affected_asset_types asset_type[], frequency_base SMALLINT DEFAULT 1 CHECK (frequency_base BETWEEN 0 AND 5), is_active BOOLEAN DEFAULT TRUE, metadata JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "vulnerabilities" '"CREATE TABLE vulnerabilities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, cve_id TEXT, title TEXT NOT NULL, description TEXT, severity vuln_severity NOT NULL DEFAULT '\''medium'\'', cvss_base_score NUMERIC(3,1) CHECK (cvss_base_score BETWEEN 0.0 AND 10.0), cvss_vector TEXT, status vuln_status DEFAULT '\''open'\'', source TEXT, scanner_ref TEXT, affected_product TEXT, affected_version TEXT, remediation TEXT, exploit_available BOOLEAN DEFAULT FALSE, patch_available BOOLEAN DEFAULT FALSE, due_date DATE, resolved_at TIMESTAMPTZ, resolved_by UUID REFERENCES profiles(id), metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "idx_vulns" '"CREATE INDEX idx_vulns_org ON vulnerabilities(organization_id); CREATE INDEX idx_vulns_severity ON vulnerabilities(organization_id, severity); CREATE INDEX idx_vulns_status ON vulnerabilities(organization_id, status); CREATE INDEX idx_vulns_cve ON vulnerabilities(cve_id)"'

run_sql "asset_vulnerabilities" '"CREATE TABLE asset_vulnerabilities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE, detected_at TIMESTAMPTZ DEFAULT now(), detected_by TEXT, status vuln_status DEFAULT '\''open'\'', notes TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(asset_id, vulnerability_id))"'

run_sql "risk_scenarios" '"CREATE TABLE risk_scenarios (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, threat_id UUID NOT NULL REFERENCES threat_catalog(id) ON DELETE CASCADE, degradation_c SMALLINT DEFAULT 0 CHECK (degradation_c BETWEEN 0 AND 100), degradation_i SMALLINT DEFAULT 0 CHECK (degradation_i BETWEEN 0 AND 100), degradation_a SMALLINT DEFAULT 0 CHECK (degradation_a BETWEEN 0 AND 100), degradation_au SMALLINT DEFAULT 0 CHECK (degradation_au BETWEEN 0 AND 100), degradation_t SMALLINT DEFAULT 0 CHECK (degradation_t BETWEEN 0 AND 100), frequency SMALLINT DEFAULT 2 CHECK (frequency BETWEEN 0 AND 5), impact_c NUMERIC(5,2) DEFAULT 0, impact_i NUMERIC(5,2) DEFAULT 0, impact_a NUMERIC(5,2) DEFAULT 0, impact_au NUMERIC(5,2) DEFAULT 0, impact_t NUMERIC(5,2) DEFAULT 0, impact_max NUMERIC(5,2) DEFAULT 0, risk_potential NUMERIC(7,2) DEFAULT 0, safeguard_effectiveness SMALLINT DEFAULT 0 CHECK (safeguard_effectiveness BETWEEN 0 AND 100), risk_residual NUMERIC(7,2) DEFAULT 0, risk_level_inherent risk_level DEFAULT '\''medium'\'', risk_level_residual risk_level DEFAULT '\''medium'\'', treatment risk_treatment DEFAULT '\''mitigate'\'', treatment_justification TEXT, risk_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL, accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL, accepted_at TIMESTAMPTZ, review_date DATE, is_active BOOLEAN DEFAULT TRUE, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "idx_risks" '"CREATE INDEX idx_risks_org ON risk_scenarios(organization_id); CREATE INDEX idx_risks_asset ON risk_scenarios(asset_id); CREATE INDEX idx_risks_threat ON risk_scenarios(threat_id); CREATE INDEX idx_risks_level_residual ON risk_scenarios(organization_id, risk_level_residual); CREATE INDEX idx_risks_treatment ON risk_scenarios(organization_id, treatment)"'

run_sql "risk_vulnerabilities" '"CREATE TABLE risk_vulnerabilities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, risk_scenario_id UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE, vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE, contribution_factor SMALLINT DEFAULT 50 CHECK (contribution_factor BETWEEN 0 AND 100), notes TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(risk_scenario_id, vulnerability_id))"'

run_sql "treatment_plans" '"CREATE TABLE treatment_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, status treatment_plan_status DEFAULT '\''draft'\'', owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL, approved_by UUID REFERENCES profiles(id), approved_at TIMESTAMPTZ, start_date DATE, target_date DATE, completed_date DATE, budget NUMERIC(12,2) DEFAULT 0, actual_cost NUMERIC(12,2) DEFAULT 0, notes TEXT, created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "treatment_plan_risks" '"CREATE TABLE treatment_plan_risks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE, risk_scenario_id UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(treatment_plan_id, risk_scenario_id))"'

run_sql "treatment_plan_actions" '"CREATE TABLE treatment_plan_actions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL, status TEXT DEFAULT '\''pending'\'' CHECK (status IN ('\''pending'\'', '\''in_progress'\'', '\''completed'\'', '\''cancelled'\'')), due_date DATE, completed_date DATE, evidence_required BOOLEAN DEFAULT FALSE, sort_order INT DEFAULT 0, notes TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

echo ""
echo "============================================"
echo "SECTION 4: Controls & Compliance"
echo "============================================"

run_sql "frameworks" '"CREATE TABLE frameworks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, version TEXT NOT NULL, description TEXT, issuing_body TEXT, category TEXT, country TEXT, url TEXT, is_active BOOLEAN DEFAULT TRUE, is_system BOOLEAN DEFAULT TRUE, metadata JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "framework_domains" '"CREATE TABLE framework_domains (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE, parent_id UUID REFERENCES framework_domains(id) ON DELETE CASCADE, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, sort_order INT DEFAULT 0, level SMALLINT DEFAULT 1, metadata JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(framework_id, code))"'

run_sql "framework_requirements" '"CREATE TABLE framework_requirements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE, domain_id UUID REFERENCES framework_domains(id) ON DELETE SET NULL, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, guidance TEXT, is_mandatory BOOLEAN DEFAULT TRUE, sort_order INT DEFAULT 0, metadata JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(framework_id, code))"'

run_sql "idx_fw" '"CREATE INDEX idx_fw_domains_framework ON framework_domains(framework_id); CREATE INDEX idx_fw_reqs_framework ON framework_requirements(framework_id); CREATE INDEX idx_fw_reqs_domain ON framework_requirements(domain_id)"'

run_sql "requirement_mappings" '"CREATE TABLE requirement_mappings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), source_requirement_id UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE, target_requirement_id UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE, mapping_strength TEXT DEFAULT '\''equivalent'\'' CHECK (mapping_strength IN ('\''equivalent'\'', '\''partial'\'', '\''related'\'', '\''superset'\'', '\''subset'\'')), notes TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(source_requirement_id, target_requirement_id), CHECK(source_requirement_id != target_requirement_id))"'

run_sql "controls" '"CREATE TABLE controls (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, objective TEXT, control_type control_type DEFAULT '\''preventive'\'', control_nature control_nature DEFAULT '\''technical'\'', automation_level control_automation DEFAULT '\''manual'\'', status control_status DEFAULT '\''not_implemented'\'', owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL, implementer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, department TEXT, design_effectiveness SMALLINT DEFAULT 0 CHECK (design_effectiveness BETWEEN 0 AND 100), operating_effectiveness SMALLINT DEFAULT 0 CHECK (operating_effectiveness BETWEEN 0 AND 100), overall_effectiveness SMALLINT DEFAULT 0 CHECK (overall_effectiveness BETWEEN 0 AND 100), execution_frequency TEXT, last_tested_at TIMESTAMPTZ, next_review_date DATE, implementation_date DATE, implementation_notes TEXT, is_key_control BOOLEAN DEFAULT FALSE, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "control_requirement_mappings" '"CREATE TABLE control_requirement_mappings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE, requirement_id UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE, coverage_percentage SMALLINT DEFAULT 100 CHECK (coverage_percentage BETWEEN 0 AND 100), compliance_status compliance_status DEFAULT '\''not_assessed'\'', justification TEXT, notes TEXT, assessed_at TIMESTAMPTZ, assessed_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(control_id, requirement_id))"'

run_sql "control_risk_mappings" '"CREATE TABLE control_risk_mappings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE, risk_scenario_id UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE, effectiveness SMALLINT DEFAULT 50 CHECK (effectiveness BETWEEN 0 AND 100), notes TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(control_id, risk_scenario_id))"'

run_sql "soa_entries" '"CREATE TABLE soa_entries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, requirement_id UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE, is_applicable BOOLEAN DEFAULT TRUE, justification TEXT NOT NULL, compliance_status compliance_status DEFAULT '\''not_assessed'\'', implementation_status control_status DEFAULT '\''not_implemented'\'', responsible_id UUID REFERENCES profiles(id), control_ids UUID[] DEFAULT '\''{}'\''::uuid[], notes TEXT, reviewed_at TIMESTAMPTZ, reviewed_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, requirement_id))"'

echo ""
echo "============================================"
echo "SECTION 5: SecOps - Incidents"
echo "============================================"

run_sql "incidents" '"CREATE TABLE incidents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, category incident_category DEFAULT '\''other'\'', severity incident_severity DEFAULT '\''medium'\'', status incident_status DEFAULT '\''detected'\'', source TEXT, source_event_id TEXT, reported_by UUID REFERENCES profiles(id), assigned_to UUID REFERENCES profiles(id), escalated_to UUID REFERENCES profiles(id), detected_at TIMESTAMPTZ DEFAULT now(), triaged_at TIMESTAMPTZ, contained_at TIMESTAMPTZ, eradicated_at TIMESTAMPTZ, recovered_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, affected_systems TEXT[], affected_users_count INT DEFAULT 0, data_breach BOOLEAN DEFAULT FALSE, pii_exposed BOOLEAN DEFAULT FALSE, financial_impact NUMERIC(12,2) DEFAULT 0, reputational_impact TEXT, root_cause TEXT, lessons_learned TEXT, containment_actions TEXT, eradication_actions TEXT, recovery_actions TEXT, requires_notification BOOLEAN DEFAULT FALSE, notification_deadline TIMESTAMPTZ, notification_sent_at TIMESTAMPTZ, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "incident_assets" '"CREATE TABLE incident_assets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE, asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, impact_description TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(incident_id, asset_id))"'

run_sql "incident_timeline" '"CREATE TABLE incident_timeline (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE, event_type TEXT NOT NULL, description TEXT NOT NULL, old_value TEXT, new_value TEXT, performed_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "incident_risks" '"CREATE TABLE incident_risks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE, risk_scenario_id UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE, notes TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(incident_id, risk_scenario_id))"'

echo ""
echo "============================================"
echo "SECTION 6: Non-Conformities & CAPA"
echo "============================================"

run_sql "nonconformities" '"CREATE TABLE nonconformities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, nc_type nc_type DEFAULT '\''minor'\'', status nc_status DEFAULT '\''open'\'', source TEXT, source_ref_id UUID, source_ref_type TEXT, raised_by UUID REFERENCES profiles(id), assigned_to UUID REFERENCES profiles(id), root_cause TEXT, root_cause_method TEXT, root_cause_completed_at TIMESTAMPTZ, detected_at DATE DEFAULT CURRENT_DATE, target_close_date DATE, closed_at TIMESTAMPTZ, verified_by UUID REFERENCES profiles(id), verified_at TIMESTAMPTZ, framework_id UUID REFERENCES frameworks(id), requirement_id UUID REFERENCES framework_requirements(id), control_id UUID REFERENCES controls(id), notes TEXT, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "capa_actions" '"CREATE TABLE capa_actions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, nonconformity_id UUID NOT NULL REFERENCES nonconformities(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, action_type capa_type DEFAULT '\''corrective'\'', responsible_id UUID REFERENCES profiles(id), status TEXT DEFAULT '\''pending'\'' CHECK (status IN ('\''pending'\'', '\''in_progress'\'', '\''completed'\'', '\''verified'\'', '\''ineffective'\'', '\''cancelled'\'')), due_date DATE, completed_date DATE, effectiveness_review_date DATE, is_effective BOOLEAN, effectiveness_notes TEXT, notes TEXT, created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

echo ""
echo "============================================"
echo "SECTION 7: Vendors"
echo "============================================"

run_sql "vendors" '"CREATE TABLE vendors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, contact_name TEXT, contact_email TEXT, contact_phone TEXT, website TEXT, country TEXT, tax_id TEXT, vendor_type TEXT, status vendor_status DEFAULT '\''under_evaluation'\'', risk_level vendor_risk_level DEFAULT '\''medium'\'', handles_pii BOOLEAN DEFAULT FALSE, handles_financial_data BOOLEAN DEFAULT FALSE, data_location TEXT, has_dpa BOOLEAN DEFAULT FALSE, dpa_signed_at DATE, has_iso27001 BOOLEAN DEFAULT FALSE, has_soc2 BOOLEAN DEFAULT FALSE, has_pentest BOOLEAN DEFAULT FALSE, last_assessment_date DATE, next_assessment_date DATE, risk_score SMALLINT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100), contract_start DATE, contract_end DATE, contract_value NUMERIC(12,2), sla_document_id UUID, notes TEXT, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "vendor_assessments" '"CREATE TABLE vendor_assessments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE, assessment_date DATE DEFAULT CURRENT_DATE, assessor_id UUID REFERENCES profiles(id), overall_score SMALLINT DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100), risk_level vendor_risk_level DEFAULT '\''medium'\'', findings JSONB DEFAULT '\''[]'\''::jsonb, questionnaire_responses JSONB DEFAULT '\''{}'\''::jsonb, status TEXT DEFAULT '\''draft'\'' CHECK (status IN ('\''draft'\'', '\''in_progress'\'', '\''completed'\'', '\''approved'\'')), approved_by UUID REFERENCES profiles(id), approved_at TIMESTAMPTZ, next_assessment_date DATE, notes TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

echo ""
echo "============================================"
echo "SECTION 8: Documents & Evidence"
echo "============================================"

run_sql "documents" '"CREATE TABLE documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, document_type document_type DEFAULT '\''other'\'', status document_status DEFAULT '\''draft'\'', version TEXT DEFAULT '\''1.0'\'', file_path TEXT, file_size BIGINT, mime_type TEXT, hash_sha256 TEXT, author_id UUID REFERENCES profiles(id), reviewer_id UUID REFERENCES profiles(id), approver_id UUID REFERENCES profiles(id), approved_at TIMESTAMPTZ, published_at TIMESTAMPTZ, review_date DATE, expiry_date DATE, confidentiality TEXT DEFAULT '\''internal'\'', department TEXT, category TEXT, retention_period_months INT DEFAULT 36, disposal_date DATE, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "document_versions" '"CREATE TABLE document_versions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE, version TEXT NOT NULL, file_path TEXT NOT NULL, file_size BIGINT, hash_sha256 TEXT, change_summary TEXT, uploaded_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "evidence" '"CREATE TABLE evidence (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, entity_type TEXT NOT NULL, entity_id UUID NOT NULL, document_id UUID REFERENCES documents(id), file_path TEXT, file_name TEXT, mime_type TEXT, file_size BIGINT, hash_sha256 TEXT, source TEXT DEFAULT '\''manual'\'', source_ref TEXT, collected_at TIMESTAMPTZ DEFAULT now(), valid_from DATE, valid_until DATE, is_valid BOOLEAN DEFAULT TRUE, reviewed_by UUID REFERENCES profiles(id), reviewed_at TIMESTAMPTZ, review_notes TEXT, metadata JSONB DEFAULT '\''{}'\''::jsonb, tags TEXT[] DEFAULT '\''{}'\''::text[], created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

echo ""
echo "============================================"
echo "SECTION 9: Audits"
echo "============================================"

run_sql "audit_programs" '"CREATE TABLE audit_programs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, year SMALLINT NOT NULL, audit_type audit_type_enum DEFAULT '\''internal'\'', status audit_status DEFAULT '\''planned'\'', framework_id UUID REFERENCES frameworks(id), scope_description TEXT, departments TEXT[], lead_auditor_id UUID REFERENCES profiles(id), auditor_ids UUID[] DEFAULT '\''{}'\''::uuid[], auditee_id UUID REFERENCES profiles(id), planned_start DATE, planned_end DATE, actual_start DATE, actual_end DATE, certification_body TEXT, certificate_number TEXT, certificate_expiry DATE, notes TEXT, metadata JSONB DEFAULT '\''{}'\''::jsonb, created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

run_sql "audit_findings" '"CREATE TABLE audit_findings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, audit_id UUID NOT NULL REFERENCES audit_programs(id) ON DELETE CASCADE, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT, severity finding_severity DEFAULT '\''minor'\'', status TEXT DEFAULT '\''open'\'' CHECK (status IN ('\''open'\'', '\''action_planned'\'', '\''in_remediation'\'', '\''closed'\'', '\''accepted'\'')), requirement_id UUID REFERENCES framework_requirements(id), control_id UUID REFERENCES controls(id), clause_reference TEXT, finding_details TEXT, auditor_recommendation TEXT, management_response TEXT, response_due_date DATE, closed_at TIMESTAMPTZ, closed_by UUID REFERENCES profiles(id), closure_evidence TEXT, nonconformity_id UUID REFERENCES nonconformities(id), created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, UNIQUE(organization_id, code))"'

echo ""
echo "============================================"
echo "SECTION 10: Automation"
echo "============================================"

run_sql "automation_rules" '"CREATE TABLE automation_rules (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, trigger_type rule_trigger NOT NULL, trigger_conditions JSONB NOT NULL DEFAULT '\''{}'\''::jsonb, action_type rule_action NOT NULL, action_config JSONB NOT NULL DEFAULT '\''{}'\''::jsonb, status rule_status DEFAULT '\''inactive'\'', priority INT DEFAULT 50, cooldown_minutes INT DEFAULT 0, last_triggered_at TIMESTAMPTZ, execution_count INT DEFAULT 0, error_count INT DEFAULT 0, last_error TEXT, created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "automation_executions" '"CREATE TABLE automation_executions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE, trigger_data JSONB NOT NULL DEFAULT '\''{}'\''::jsonb, action_result JSONB DEFAULT '\''{}'\''::jsonb, status TEXT DEFAULT '\''success'\'' CHECK (status IN ('\''success'\'', '\''failure'\'', '\''skipped'\'')), error_message TEXT, duration_ms INT, created_entity_type TEXT, created_entity_id UUID, executed_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

echo ""
echo "============================================"
echo "SECTION 11: Integrations"
echo "============================================"

run_sql "integration_connectors" '"CREATE TABLE integration_connectors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, integration_type integration_type NOT NULL, status integration_status DEFAULT '\''configuring'\'', config JSONB DEFAULT '\''{}'\''::jsonb, auth_config JSONB DEFAULT '\''{}'\''::jsonb, endpoint_url TEXT, last_sync_at TIMESTAMPTZ, sync_interval_minutes INT DEFAULT 60, error_count INT DEFAULT 0, last_error TEXT, health_check_at TIMESTAMPTZ, created_by UUID REFERENCES profiles(id), updated_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "integration_events" '"CREATE TABLE integration_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, connector_id UUID NOT NULL REFERENCES integration_connectors(id) ON DELETE CASCADE, event_type TEXT NOT NULL, source_event_id TEXT, raw_payload JSONB DEFAULT '\''{}'\''::jsonb, processed BOOLEAN DEFAULT FALSE, processed_at TIMESTAMPTZ, processing_result JSONB DEFAULT '\''{}'\''::jsonb, error_message TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

echo ""
echo "============================================"
echo "SECTION 12: Audit Logs + Notifications + Metrics"
echo "============================================"

run_sql "audit_logs" '"CREATE TABLE audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL, user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, action audit_log_action NOT NULL, entity_type TEXT NOT NULL, entity_id UUID, entity_name TEXT, old_values JSONB, new_values JSONB, ip_address INET, user_agent TEXT, session_id TEXT, metadata JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "notifications" '"CREATE TABLE notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, title TEXT NOT NULL, message TEXT, notification_type TEXT DEFAULT '\''info'\'', entity_type TEXT, entity_id UUID, is_read BOOLEAN DEFAULT FALSE, read_at TIMESTAMPTZ, metadata JSONB DEFAULT '\''{}'\''::jsonb, created_at TIMESTAMPTZ DEFAULT now() NOT NULL)"'

run_sql "dashboard_metrics" '"CREATE TABLE dashboard_metrics (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, metric_type TEXT NOT NULL, metric_key TEXT NOT NULL, metric_value JSONB NOT NULL DEFAULT '\''{}'\''::jsonb, period TEXT, calculated_at TIMESTAMPTZ DEFAULT now() NOT NULL, expires_at TIMESTAMPTZ)"'

echo ""
echo "============================================"
echo "VERIFICATION"
echo "============================================"

curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT tablename FROM pg_tables WHERE schemaname = '\''public'\'' ORDER BY tablename"}' | python -c "
import sys, json
tables = json.load(sys.stdin)
print(f'Total tables: {len(tables)}')
for t in tables:
    print(f'  - {t[\"tablename\"]}')
"

echo ""
echo "DONE!"
