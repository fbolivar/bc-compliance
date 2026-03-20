-- =====================================================
-- BC COMPLIANCE - MIGRATION PART 2: Risk Model & Controls
-- =====================================================

-- =====================================================
-- SECTION 3: MAGERIT 3.0 THREAT & RISK MODEL
-- =====================================================

CREATE TABLE threat_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    origin          threat_origin NOT NULL,
    affected_dimensions magerit_dimension[] NOT NULL,
    affected_asset_types asset_type[],
    frequency_base  SMALLINT DEFAULT 1 CHECK (frequency_base BETWEEN 0 AND 5),
    is_active       BOOLEAN DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_threat_catalog_org ON threat_catalog(organization_id);
CREATE INDEX idx_threat_catalog_origin ON threat_catalog(origin);

CREATE TABLE vulnerabilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    cve_id          TEXT,
    title           TEXT NOT NULL,
    description     TEXT,
    severity        vuln_severity NOT NULL DEFAULT 'medium',
    cvss_base_score NUMERIC(3,1) CHECK (cvss_base_score BETWEEN 0.0 AND 10.0),
    cvss_vector     TEXT,
    status          vuln_status DEFAULT 'open',
    source          TEXT,
    scanner_ref     TEXT,
    affected_product TEXT,
    affected_version TEXT,
    remediation     TEXT,
    exploit_available BOOLEAN DEFAULT FALSE,
    patch_available BOOLEAN DEFAULT FALSE,
    due_date        DATE,
    resolved_at     TIMESTAMPTZ,
    resolved_by     UUID REFERENCES profiles(id),
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_vulns_org ON vulnerabilities(organization_id);
CREATE INDEX idx_vulns_severity ON vulnerabilities(organization_id, severity);
CREATE INDEX idx_vulns_status ON vulnerabilities(organization_id, status);
CREATE INDEX idx_vulns_cve ON vulnerabilities(cve_id);

CREATE TABLE asset_vulnerabilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    detected_at     TIMESTAMPTZ DEFAULT now(),
    detected_by     TEXT,
    status          vuln_status DEFAULT 'open',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(asset_id, vulnerability_id)
);

CREATE TABLE risk_scenarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    threat_id       UUID NOT NULL REFERENCES threat_catalog(id) ON DELETE CASCADE,
    degradation_c   SMALLINT DEFAULT 0 CHECK (degradation_c BETWEEN 0 AND 100),
    degradation_i   SMALLINT DEFAULT 0 CHECK (degradation_i BETWEEN 0 AND 100),
    degradation_a   SMALLINT DEFAULT 0 CHECK (degradation_a BETWEEN 0 AND 100),
    degradation_au  SMALLINT DEFAULT 0 CHECK (degradation_au BETWEEN 0 AND 100),
    degradation_t   SMALLINT DEFAULT 0 CHECK (degradation_t BETWEEN 0 AND 100),
    frequency       SMALLINT DEFAULT 2 CHECK (frequency BETWEEN 0 AND 5),
    impact_c        NUMERIC(5,2) DEFAULT 0,
    impact_i        NUMERIC(5,2) DEFAULT 0,
    impact_a        NUMERIC(5,2) DEFAULT 0,
    impact_au       NUMERIC(5,2) DEFAULT 0,
    impact_t        NUMERIC(5,2) DEFAULT 0,
    impact_max      NUMERIC(5,2) DEFAULT 0,
    risk_potential   NUMERIC(7,2) DEFAULT 0,
    safeguard_effectiveness SMALLINT DEFAULT 0 CHECK (safeguard_effectiveness BETWEEN 0 AND 100),
    risk_residual    NUMERIC(7,2) DEFAULT 0,
    risk_level_inherent  risk_level DEFAULT 'medium',
    risk_level_residual  risk_level DEFAULT 'medium',
    treatment        risk_treatment DEFAULT 'mitigate',
    treatment_justification TEXT,
    risk_owner_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    accepted_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    accepted_at      TIMESTAMPTZ,
    review_date      DATE,
    is_active        BOOLEAN DEFAULT TRUE,
    metadata         JSONB DEFAULT '{}',
    tags             TEXT[] DEFAULT '{}',
    created_by       UUID REFERENCES profiles(id),
    updated_by       UUID REFERENCES profiles(id),
    created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_risks_org ON risk_scenarios(organization_id);
CREATE INDEX idx_risks_asset ON risk_scenarios(asset_id);
CREATE INDEX idx_risks_threat ON risk_scenarios(threat_id);
CREATE INDEX idx_risks_level_residual ON risk_scenarios(organization_id, risk_level_residual);
CREATE INDEX idx_risks_treatment ON risk_scenarios(organization_id, treatment);

CREATE TABLE risk_vulnerabilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    risk_scenario_id UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE,
    vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    contribution_factor SMALLINT DEFAULT 50 CHECK (contribution_factor BETWEEN 0 AND 100),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(risk_scenario_id, vulnerability_id)
);

CREATE TABLE treatment_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    status          treatment_plan_status DEFAULT 'draft',
    owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by     UUID REFERENCES profiles(id),
    approved_at     TIMESTAMPTZ,
    start_date      DATE,
    target_date     DATE,
    completed_date  DATE,
    budget          NUMERIC(12,2) DEFAULT 0,
    actual_cost     NUMERIC(12,2) DEFAULT 0,
    notes           TEXT,
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE TABLE treatment_plan_risks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    risk_scenario_id  UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(treatment_plan_id, risk_scenario_id)
);

CREATE TABLE treatment_plan_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    responsible_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date        DATE,
    completed_date  DATE,
    evidence_required BOOLEAN DEFAULT FALSE,
    sort_order      INT DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 4: CONTROL MANAGEMENT & COMPLIANCE MAPPING
-- =====================================================

CREATE TABLE frameworks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    version         TEXT NOT NULL,
    description     TEXT,
    issuing_body    TEXT,
    category        TEXT,
    country         TEXT,
    url             TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    is_system       BOOLEAN DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE framework_domains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES framework_domains(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    sort_order      INT DEFAULT 0,
    level           SMALLINT DEFAULT 1,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(framework_id, code)
);

CREATE INDEX idx_fw_domains_framework ON framework_domains(framework_id);

CREATE TABLE framework_requirements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
    domain_id       UUID REFERENCES framework_domains(id) ON DELETE SET NULL,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    guidance        TEXT,
    is_mandatory    BOOLEAN DEFAULT TRUE,
    sort_order      INT DEFAULT 0,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(framework_id, code)
);

CREATE INDEX idx_fw_reqs_framework ON framework_requirements(framework_id);
CREATE INDEX idx_fw_reqs_domain ON framework_requirements(domain_id);

CREATE TABLE requirement_mappings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_requirement_id UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE,
    target_requirement_id UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE,
    mapping_strength    TEXT DEFAULT 'equivalent' CHECK (mapping_strength IN ('equivalent', 'partial', 'related', 'superset', 'subset')),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(source_requirement_id, target_requirement_id),
    CHECK(source_requirement_id != target_requirement_id)
);

CREATE INDEX idx_req_map_source ON requirement_mappings(source_requirement_id);
CREATE INDEX idx_req_map_target ON requirement_mappings(target_requirement_id);

CREATE TABLE controls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    objective       TEXT,
    control_type    control_type DEFAULT 'preventive',
    control_nature  control_nature DEFAULT 'technical',
    automation_level control_automation DEFAULT 'manual',
    status          control_status DEFAULT 'not_implemented',
    owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    implementer_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    department      TEXT,
    design_effectiveness     SMALLINT DEFAULT 0 CHECK (design_effectiveness BETWEEN 0 AND 100),
    operating_effectiveness  SMALLINT DEFAULT 0 CHECK (operating_effectiveness BETWEEN 0 AND 100),
    overall_effectiveness    SMALLINT DEFAULT 0 CHECK (overall_effectiveness BETWEEN 0 AND 100),
    execution_frequency TEXT,
    last_tested_at  TIMESTAMPTZ,
    next_review_date DATE,
    implementation_date DATE,
    implementation_notes TEXT,
    is_key_control  BOOLEAN DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_controls_org ON controls(organization_id);
CREATE INDEX idx_controls_status ON controls(organization_id, status);

CREATE TABLE control_requirement_mappings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id          UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    requirement_id      UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE,
    coverage_percentage SMALLINT DEFAULT 100 CHECK (coverage_percentage BETWEEN 0 AND 100),
    compliance_status   compliance_status DEFAULT 'not_assessed',
    justification       TEXT,
    notes               TEXT,
    assessed_at         TIMESTAMPTZ,
    assessed_by         UUID REFERENCES profiles(id),
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(control_id, requirement_id)
);

CREATE INDEX idx_ctrl_req_map_org ON control_requirement_mappings(organization_id);
CREATE INDEX idx_ctrl_req_map_ctrl ON control_requirement_mappings(control_id);
CREATE INDEX idx_ctrl_req_map_req ON control_requirement_mappings(requirement_id);

CREATE TABLE control_risk_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id      UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    risk_scenario_id UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE,
    effectiveness   SMALLINT DEFAULT 50 CHECK (effectiveness BETWEEN 0 AND 100),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(control_id, risk_scenario_id)
);

CREATE TABLE soa_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requirement_id  UUID NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE,
    is_applicable   BOOLEAN DEFAULT TRUE,
    justification   TEXT NOT NULL,
    compliance_status compliance_status DEFAULT 'not_assessed',
    implementation_status control_status DEFAULT 'not_implemented',
    responsible_id  UUID REFERENCES profiles(id),
    control_ids     UUID[] DEFAULT '{}',
    notes           TEXT,
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, requirement_id)
);
