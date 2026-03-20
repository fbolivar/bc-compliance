-- =====================================================
-- BC COMPLIANCE - MIGRATION PART 1: Extensions, Enums & Core Platform
-- =====================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE org_plan AS ENUM ('starter', 'professional', 'enterprise', 'custom');
CREATE TYPE asset_type AS ENUM ('hardware', 'software', 'network', 'data', 'personnel', 'facility', 'service', 'intangible', 'cloud_resource', 'iot_device');
CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'decommissioned', 'under_maintenance', 'planned');
CREATE TYPE asset_criticality AS ENUM ('very_high', 'high', 'medium', 'low', 'very_low');
CREATE TYPE magerit_dimension AS ENUM ('confidentiality', 'integrity', 'availability', 'authenticity', 'traceability');
CREATE TYPE threat_origin AS ENUM ('natural', 'industrial', 'defects', 'deliberate');
CREATE TYPE risk_level AS ENUM ('critical', 'high', 'medium', 'low', 'negligible');
CREATE TYPE risk_treatment AS ENUM ('mitigate', 'transfer', 'accept', 'avoid', 'share');
CREATE TYPE treatment_plan_status AS ENUM ('draft', 'approved', 'in_progress', 'completed', 'cancelled', 'overdue');
CREATE TYPE control_status AS ENUM ('not_implemented', 'planned', 'partially_implemented', 'implemented', 'not_applicable');
CREATE TYPE control_type AS ENUM ('preventive', 'detective', 'corrective', 'deterrent', 'compensating', 'recovery');
CREATE TYPE control_nature AS ENUM ('technical', 'organizational', 'physical', 'legal');
CREATE TYPE control_automation AS ENUM ('manual', 'semi_automated', 'fully_automated');
CREATE TYPE compliance_status AS ENUM ('compliant', 'partially_compliant', 'non_compliant', 'not_assessed', 'not_applicable');
CREATE TYPE vuln_severity AS ENUM ('critical', 'high', 'medium', 'low', 'informational');
CREATE TYPE vuln_status AS ENUM ('open', 'in_remediation', 'mitigated', 'accepted', 'false_positive', 'closed');
CREATE TYPE incident_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE incident_status AS ENUM ('detected', 'triaged', 'investigating', 'containing', 'eradicating', 'recovering', 'post_incident', 'closed');
CREATE TYPE incident_category AS ENUM ('malware', 'phishing', 'data_breach', 'denial_of_service', 'unauthorized_access', 'insider_threat', 'ransomware', 'physical', 'supply_chain', 'configuration_error', 'other');
CREATE TYPE nc_type AS ENUM ('major', 'minor', 'observation', 'opportunity_for_improvement');
CREATE TYPE nc_status AS ENUM ('open', 'root_cause_analysis', 'action_planned', 'action_in_progress', 'verification', 'closed', 'reopened');
CREATE TYPE capa_type AS ENUM ('corrective', 'preventive', 'improvement');
CREATE TYPE vendor_risk_level AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE vendor_status AS ENUM ('active', 'under_evaluation', 'approved', 'suspended', 'terminated');
CREATE TYPE document_type AS ENUM ('policy', 'procedure', 'standard', 'guideline', 'template', 'record', 'evidence', 'report', 'certificate', 'contract', 'sla', 'other');
CREATE TYPE document_status AS ENUM ('draft', 'under_review', 'approved', 'published', 'archived', 'obsolete');
CREATE TYPE audit_type_enum AS ENUM ('internal', 'external', 'certification', 'surveillance', 'follow_up');
CREATE TYPE audit_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE finding_severity AS ENUM ('critical', 'major', 'minor', 'observation');
CREATE TYPE rule_trigger AS ENUM ('siem_event', 'vulnerability_detected', 'compliance_change', 'incident_created', 'scheduled', 'manual');
CREATE TYPE rule_action AS ENUM ('create_evidence', 'create_incident', 'update_risk', 'send_notification', 'update_control_status', 'create_nonconformity', 'escalate', 'execute_webhook');
CREATE TYPE rule_status AS ENUM ('active', 'inactive', 'testing');
CREATE TYPE integration_type AS ENUM ('siem', 'vulnerability_scanner', 'edr_xdr', 'directory', 'ticketing', 'email', 'custom_webhook');
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error', 'configuring');
CREATE TYPE audit_log_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'approve', 'reject', 'assign', 'escalate', 'generate_report', 'bulk_import', 'integration_sync', 'rule_execution', 'permission_change');

-- =====================================================
-- SECTION 1: CORE PLATFORM (Multi-tenancy & Auth)
-- =====================================================

CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    tax_id          TEXT,
    industry        TEXT,
    country         TEXT DEFAULT 'CO',
    address         TEXT,
    logo_url        TEXT,
    plan            org_plan DEFAULT 'starter',
    max_users       INT DEFAULT 5,
    max_assets      INT DEFAULT 100,
    settings        JSONB DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    trial_ends_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    phone           TEXT,
    job_title       TEXT,
    department      TEXT,
    status          user_status DEFAULT 'active',
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    preferences     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id         UUID,
    is_owner        BOOLEAN DEFAULT FALSE,
    joined_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
    invited_by      UUID REFERENCES profiles(id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    is_system_role  BOOLEAN DEFAULT FALSE,
    permissions     JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

ALTER TABLE organization_members
    ADD CONSTRAINT fk_org_members_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module          TEXT NOT NULL,
    action          TEXT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(module, action)
);

CREATE TABLE role_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    conditions      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(role_id, permission_id)
);

-- =====================================================
-- SECTION 2: ASSET MANAGEMENT (CMDB)
-- =====================================================

CREATE TABLE asset_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    parent_id       UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    icon            TEXT,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    asset_type      asset_type NOT NULL,
    category_id     UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    status          asset_status DEFAULT 'active',
    criticality     asset_criticality DEFAULT 'medium',
    owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    custodian_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    department      TEXT,
    location        TEXT,
    val_confidentiality  SMALLINT DEFAULT 0 CHECK (val_confidentiality BETWEEN 0 AND 10),
    val_integrity        SMALLINT DEFAULT 0 CHECK (val_integrity BETWEEN 0 AND 10),
    val_availability     SMALLINT DEFAULT 0 CHECK (val_availability BETWEEN 0 AND 10),
    val_authenticity     SMALLINT DEFAULT 0 CHECK (val_authenticity BETWEEN 0 AND 10),
    val_traceability     SMALLINT DEFAULT 0 CHECK (val_traceability BETWEEN 0 AND 10),
    ip_address      INET,
    hostname        TEXT,
    mac_address     MACADDR,
    operating_system TEXT,
    software_version TEXT,
    serial_number   TEXT,
    manufacturer    TEXT,
    model           TEXT,
    acquisition_date DATE,
    warranty_expiry  DATE,
    end_of_life     DATE,
    disposal_date   DATE,
    is_critical     BOOLEAN DEFAULT FALSE,
    data_classification TEXT,
    pii_data        BOOLEAN DEFAULT FALSE,
    financial_data  BOOLEAN DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_assets_org ON assets(organization_id);
CREATE INDEX idx_assets_type ON assets(organization_id, asset_type);
CREATE INDEX idx_assets_status ON assets(organization_id, status);
CREATE INDEX idx_assets_criticality ON assets(organization_id, criticality);
CREATE INDEX idx_assets_owner ON assets(owner_id);
CREATE INDEX idx_assets_search ON assets USING gin(to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, '')));

CREATE TABLE asset_dependencies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    child_asset_id  UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    dependency_type TEXT DEFAULT 'depends_on',
    description     TEXT,
    is_critical     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(parent_asset_id, child_asset_id),
    CHECK(parent_asset_id != child_asset_id)
);
