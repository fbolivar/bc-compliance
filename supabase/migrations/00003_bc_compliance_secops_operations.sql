-- =====================================================
-- BC COMPLIANCE - MIGRATION PART 3: SecOps & Operations
-- =====================================================

-- =====================================================
-- SECTION 5: SECURITY INCIDENTS
-- =====================================================

CREATE TABLE incidents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    category        incident_category DEFAULT 'other',
    severity        incident_severity DEFAULT 'medium',
    status          incident_status DEFAULT 'detected',
    source          TEXT,
    source_event_id TEXT,
    reported_by     UUID REFERENCES profiles(id),
    assigned_to     UUID REFERENCES profiles(id),
    escalated_to    UUID REFERENCES profiles(id),
    detected_at     TIMESTAMPTZ DEFAULT now(),
    triaged_at      TIMESTAMPTZ,
    contained_at    TIMESTAMPTZ,
    eradicated_at   TIMESTAMPTZ,
    recovered_at    TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    affected_systems TEXT[],
    affected_users_count INT DEFAULT 0,
    data_breach     BOOLEAN DEFAULT FALSE,
    pii_exposed     BOOLEAN DEFAULT FALSE,
    financial_impact NUMERIC(12,2) DEFAULT 0,
    reputational_impact TEXT,
    root_cause      TEXT,
    lessons_learned TEXT,
    containment_actions TEXT,
    eradication_actions TEXT,
    recovery_actions TEXT,
    requires_notification BOOLEAN DEFAULT FALSE,
    notification_deadline TIMESTAMPTZ,
    notification_sent_at  TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_incidents_org ON incidents(organization_id);
CREATE INDEX idx_incidents_severity ON incidents(organization_id, severity);
CREATE INDEX idx_incidents_status ON incidents(organization_id, status);
CREATE INDEX idx_incidents_detected ON incidents(detected_at DESC);

CREATE TABLE incident_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id     UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    impact_description TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(incident_id, asset_id)
);

CREATE TABLE incident_timeline (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id     UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    description     TEXT NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    performed_by    UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_inc_timeline_incident ON incident_timeline(incident_id);

CREATE TABLE incident_risks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id     UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    risk_scenario_id UUID NOT NULL REFERENCES risk_scenarios(id) ON DELETE CASCADE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(incident_id, risk_scenario_id)
);

-- =====================================================
-- SECTION 6: NON-CONFORMITIES & CAPA
-- =====================================================

CREATE TABLE nonconformities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    nc_type         nc_type DEFAULT 'minor',
    status          nc_status DEFAULT 'open',
    source          TEXT,
    source_ref_id   UUID,
    source_ref_type TEXT,
    raised_by       UUID REFERENCES profiles(id),
    assigned_to     UUID REFERENCES profiles(id),
    root_cause      TEXT,
    root_cause_method TEXT,
    root_cause_completed_at TIMESTAMPTZ,
    detected_at     DATE DEFAULT CURRENT_DATE,
    target_close_date DATE,
    closed_at       TIMESTAMPTZ,
    verified_by     UUID REFERENCES profiles(id),
    verified_at     TIMESTAMPTZ,
    framework_id    UUID REFERENCES frameworks(id),
    requirement_id  UUID REFERENCES framework_requirements(id),
    control_id      UUID REFERENCES controls(id),
    notes           TEXT,
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_nc_org ON nonconformities(organization_id);
CREATE INDEX idx_nc_status ON nonconformities(organization_id, status);

CREATE TABLE capa_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    nonconformity_id UUID NOT NULL REFERENCES nonconformities(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    action_type     capa_type DEFAULT 'corrective',
    responsible_id  UUID REFERENCES profiles(id),
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified', 'ineffective', 'cancelled')),
    due_date        DATE,
    completed_date  DATE,
    effectiveness_review_date DATE,
    is_effective    BOOLEAN,
    effectiveness_notes TEXT,
    notes           TEXT,
    created_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

-- =====================================================
-- SECTION 7: VENDOR MANAGEMENT
-- =====================================================

CREATE TABLE vendors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    contact_name    TEXT,
    contact_email   TEXT,
    contact_phone   TEXT,
    website         TEXT,
    country         TEXT,
    tax_id          TEXT,
    vendor_type     TEXT,
    status          vendor_status DEFAULT 'under_evaluation',
    risk_level      vendor_risk_level DEFAULT 'medium',
    handles_pii     BOOLEAN DEFAULT FALSE,
    handles_financial_data BOOLEAN DEFAULT FALSE,
    data_location   TEXT,
    has_dpa         BOOLEAN DEFAULT FALSE,
    dpa_signed_at   DATE,
    has_iso27001    BOOLEAN DEFAULT FALSE,
    has_soc2        BOOLEAN DEFAULT FALSE,
    has_pentest     BOOLEAN DEFAULT FALSE,
    last_assessment_date DATE,
    next_assessment_date DATE,
    risk_score      SMALLINT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    contract_start  DATE,
    contract_end    DATE,
    contract_value  NUMERIC(12,2),
    sla_document_id UUID,
    notes           TEXT,
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_vendors_org ON vendors(organization_id);
CREATE INDEX idx_vendors_risk ON vendors(organization_id, risk_level);

CREATE TABLE vendor_assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    assessment_date DATE DEFAULT CURRENT_DATE,
    assessor_id     UUID REFERENCES profiles(id),
    overall_score   SMALLINT DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
    risk_level      vendor_risk_level DEFAULT 'medium',
    findings        JSONB DEFAULT '[]',
    questionnaire_responses JSONB DEFAULT '{}',
    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved')),
    approved_by     UUID REFERENCES profiles(id),
    approved_at     TIMESTAMPTZ,
    next_assessment_date DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 8: DOCUMENT MANAGEMENT & EVIDENCE
-- =====================================================

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    document_type   document_type DEFAULT 'other',
    status          document_status DEFAULT 'draft',
    version         TEXT DEFAULT '1.0',
    file_path       TEXT,
    file_size       BIGINT,
    mime_type       TEXT,
    hash_sha256     TEXT,
    author_id       UUID REFERENCES profiles(id),
    reviewer_id     UUID REFERENCES profiles(id),
    approver_id     UUID REFERENCES profiles(id),
    approved_at     TIMESTAMPTZ,
    published_at    TIMESTAMPTZ,
    review_date     DATE,
    expiry_date     DATE,
    confidentiality TEXT DEFAULT 'internal',
    department      TEXT,
    category        TEXT,
    retention_period_months INT DEFAULT 36,
    disposal_date   DATE,
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(organization_id, document_type);

CREATE TABLE document_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version         TEXT NOT NULL,
    file_path       TEXT NOT NULL,
    file_size       BIGINT,
    hash_sha256     TEXT,
    change_summary  TEXT,
    uploaded_by     UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE evidence (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    document_id     UUID REFERENCES documents(id),
    file_path       TEXT,
    file_name       TEXT,
    mime_type       TEXT,
    file_size       BIGINT,
    hash_sha256     TEXT,
    source          TEXT DEFAULT 'manual',
    source_ref      TEXT,
    collected_at    TIMESTAMPTZ DEFAULT now(),
    valid_from      DATE,
    valid_until     DATE,
    is_valid        BOOLEAN DEFAULT TRUE,
    reviewed_by     UUID REFERENCES profiles(id),
    reviewed_at     TIMESTAMPTZ,
    review_notes    TEXT,
    metadata        JSONB DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_evidence_org ON evidence(organization_id);
CREATE INDEX idx_evidence_entity ON evidence(entity_type, entity_id);

-- =====================================================
-- SECTION 9: AUDIT MANAGEMENT
-- =====================================================

CREATE TABLE audit_programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    year            SMALLINT NOT NULL,
    audit_type      audit_type_enum DEFAULT 'internal',
    status          audit_status DEFAULT 'planned',
    framework_id    UUID REFERENCES frameworks(id),
    scope_description TEXT,
    departments     TEXT[],
    lead_auditor_id UUID REFERENCES profiles(id),
    auditor_ids     UUID[] DEFAULT '{}',
    auditee_id      UUID REFERENCES profiles(id),
    planned_start   DATE,
    planned_end     DATE,
    actual_start    DATE,
    actual_end      DATE,
    certification_body TEXT,
    certificate_number TEXT,
    certificate_expiry DATE,
    notes           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE TABLE audit_findings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_id        UUID NOT NULL REFERENCES audit_programs(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    severity        finding_severity DEFAULT 'minor',
    status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'action_planned', 'in_remediation', 'closed', 'accepted')),
    requirement_id  UUID REFERENCES framework_requirements(id),
    control_id      UUID REFERENCES controls(id),
    clause_reference TEXT,
    finding_details TEXT,
    auditor_recommendation TEXT,
    management_response TEXT,
    response_due_date DATE,
    closed_at       TIMESTAMPTZ,
    closed_by       UUID REFERENCES profiles(id),
    closure_evidence TEXT,
    nonconformity_id UUID REFERENCES nonconformities(id),
    created_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_findings_audit ON audit_findings(audit_id);

-- =====================================================
-- SECTION 10: AUTOMATION / SOAR-LITE
-- =====================================================

CREATE TABLE automation_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    trigger_type    rule_trigger NOT NULL,
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    action_type     rule_action NOT NULL,
    action_config   JSONB NOT NULL DEFAULT '{}',
    status          rule_status DEFAULT 'inactive',
    priority        INT DEFAULT 50,
    cooldown_minutes INT DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    execution_count INT DEFAULT 0,
    error_count     INT DEFAULT 0,
    last_error      TEXT,
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_rules_org ON automation_rules(organization_id);
CREATE INDEX idx_rules_status ON automation_rules(status);

CREATE TABLE automation_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rule_id         UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    trigger_data    JSONB NOT NULL DEFAULT '{}',
    action_result   JSONB DEFAULT '{}',
    status          TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'skipped')),
    error_message   TEXT,
    duration_ms     INT,
    created_entity_type TEXT,
    created_entity_id UUID,
    executed_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_auto_exec_rule ON automation_executions(rule_id);
CREATE INDEX idx_auto_exec_date ON automation_executions(executed_at DESC);

-- =====================================================
-- SECTION 11: INTEGRATION CONNECTORS
-- =====================================================

CREATE TABLE integration_connectors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    integration_type integration_type NOT NULL,
    status          integration_status DEFAULT 'configuring',
    config          JSONB DEFAULT '{}',
    auth_config     JSONB DEFAULT '{}',
    endpoint_url    TEXT,
    last_sync_at    TIMESTAMPTZ,
    sync_interval_minutes INT DEFAULT 60,
    error_count     INT DEFAULT 0,
    last_error      TEXT,
    health_check_at TIMESTAMPTZ,
    created_by      UUID REFERENCES profiles(id),
    updated_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_connectors_org ON integration_connectors(organization_id);

CREATE TABLE integration_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    connector_id    UUID NOT NULL REFERENCES integration_connectors(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    source_event_id TEXT,
    raw_payload     JSONB DEFAULT '{}',
    processed       BOOLEAN DEFAULT FALSE,
    processed_at    TIMESTAMPTZ,
    processing_result JSONB DEFAULT '{}',
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_int_events_connector ON integration_events(connector_id);
CREATE INDEX idx_int_events_processed ON integration_events(processed);

-- =====================================================
-- SECTION 12: IMMUTABLE AUDIT LOG
-- =====================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action          audit_log_action NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    entity_name     TEXT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    session_id      TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at DESC);

-- Prevent updates and deletes on audit_logs (immutable)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. Updates and deletes are not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- =====================================================
-- SECTION 13: NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    message         TEXT,
    notification_type TEXT DEFAULT 'info',
    entity_type     TEXT,
    entity_id       UUID,
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =====================================================
-- SECTION 14: DASHBOARD METRICS CACHE
-- =====================================================

CREATE TABLE dashboard_metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type     TEXT NOT NULL,
    metric_key      TEXT NOT NULL,
    metric_value    JSONB NOT NULL DEFAULT '{}',
    period          TEXT,
    calculated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at      TIMESTAMPTZ
);

CREATE INDEX idx_metrics_org ON dashboard_metrics(organization_id, metric_type);
