// =====================================================
// BC COMPLIANCE - Core Database Types
// Enterprise GRC + SecOps Fusion Platform
// =====================================================

// ========== ENUMS ==========

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type OrgPlan = 'starter' | 'professional' | 'enterprise' | 'custom';
export type AssetType =
  | 'hardware'
  | 'software'
  | 'network'
  | 'data'
  | 'personnel'
  | 'facility'
  | 'service'
  | 'intangible'
  | 'cloud_resource'
  | 'iot_device';
export type AssetStatus =
  | 'active'
  | 'inactive'
  | 'decommissioned'
  | 'under_maintenance'
  | 'planned';
export type AssetCriticality = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
export type MageritDimension =
  | 'confidentiality'
  | 'integrity'
  | 'availability'
  | 'authenticity'
  | 'traceability';
export type ThreatOrigin = 'natural' | 'industrial' | 'defects' | 'deliberate';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'negligible';
export type RiskTreatment = 'mitigate' | 'transfer' | 'accept' | 'avoid' | 'share';
export type TreatmentPlanStatus =
  | 'draft'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue';
export type ControlStatus =
  | 'not_implemented'
  | 'planned'
  | 'partially_implemented'
  | 'implemented'
  | 'not_applicable';
export type ControlType =
  | 'preventive'
  | 'detective'
  | 'corrective'
  | 'deterrent'
  | 'compensating'
  | 'recovery';
export type ControlNature = 'technical' | 'organizational' | 'physical' | 'legal';
export type ControlAutomation = 'manual' | 'semi_automated' | 'fully_automated';
export type ComplianceStatus =
  | 'compliant'
  | 'partially_compliant'
  | 'non_compliant'
  | 'not_assessed'
  | 'not_applicable';
export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type VulnStatus =
  | 'open'
  | 'in_remediation'
  | 'mitigated'
  | 'accepted'
  | 'false_positive'
  | 'closed';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus =
  | 'detected'
  | 'triaged'
  | 'investigating'
  | 'containing'
  | 'eradicating'
  | 'recovering'
  | 'post_incident'
  | 'closed';
export type IncidentCategory =
  | 'malware'
  | 'phishing'
  | 'data_breach'
  | 'denial_of_service'
  | 'unauthorized_access'
  | 'insider_threat'
  | 'ransomware'
  | 'physical'
  | 'supply_chain'
  | 'configuration_error'
  | 'other';
export type NCType = 'major' | 'minor' | 'observation' | 'opportunity_for_improvement';
export type NCStatus =
  | 'open'
  | 'root_cause_analysis'
  | 'action_planned'
  | 'action_in_progress'
  | 'verification'
  | 'closed'
  | 'reopened';
export type CAPAType = 'corrective' | 'preventive' | 'improvement';
export type VendorRiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type VendorStatus =
  | 'active'
  | 'under_evaluation'
  | 'approved'
  | 'suspended'
  | 'terminated';
export type DocumentType =
  | 'policy'
  | 'procedure'
  | 'standard'
  | 'guideline'
  | 'template'
  | 'record'
  | 'evidence'
  | 'report'
  | 'certificate'
  | 'contract'
  | 'sla'
  | 'other';
export type DocumentStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'obsolete';
export type AuditType =
  | 'internal'
  | 'external'
  | 'certification'
  | 'surveillance'
  | 'follow_up';
export type AuditStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'observation';
export type RuleTrigger =
  | 'siem_event'
  | 'vulnerability_detected'
  | 'compliance_change'
  | 'incident_created'
  | 'scheduled'
  | 'manual';
export type RuleAction =
  | 'create_evidence'
  | 'create_incident'
  | 'update_risk'
  | 'send_notification'
  | 'update_control_status'
  | 'create_nonconformity'
  | 'escalate'
  | 'execute_webhook';
export type RuleStatus = 'active' | 'inactive' | 'testing';
export type IntegrationType =
  | 'siem'
  | 'vulnerability_scanner'
  | 'edr_xdr'
  | 'directory'
  | 'ticketing'
  | 'email'
  | 'custom_webhook';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'configuring';
export type AuditLogAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'escalate'
  | 'generate_report'
  | 'bulk_import'
  | 'integration_sync'
  | 'rule_execution'
  | 'permission_change';
export type MappingStrength = 'equivalent' | 'partial' | 'related' | 'superset' | 'subset';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
export type NotificationPriority = 'urgent' | 'high' | 'medium' | 'low';
export type EvidenceType =
  | 'screenshot'
  | 'log_file'
  | 'configuration_export'
  | 'scan_report'
  | 'attestation'
  | 'certificate'
  | 'test_result'
  | 'other';
export type MetricCategory =
  | 'risk'
  | 'compliance'
  | 'vulnerability'
  | 'incident'
  | 'control'
  | 'vendor'
  | 'audit';
export type MetricTrend = 'improving' | 'stable' | 'degrading' | 'unknown';

// ========== INTERFACES ==========

// ---- Core Platform ----

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tax_id?: string;
  industry?: string;
  country: string;
  address?: string;
  logo_url?: string;
  plan: OrgPlan;
  max_users: number;
  max_assets: number;
  settings: Record<string, unknown>;
  is_active: boolean;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  status: UserStatus;
  mfa_enabled: boolean;
  last_login_at?: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role_id?: string;
  is_owner: boolean;
  joined_at: string;
  invited_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  profile?: Profile;
  role?: Role;
  organization?: Organization;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
  created_at: string;
}

// ---- Asset Management (CMDB) ----

export interface AssetCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  // Relations
  parent?: AssetCategory;
  children?: AssetCategory[];
}

export interface Asset {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  asset_type: AssetType;
  category_id?: string;
  status: AssetStatus;
  criticality: AssetCriticality;
  owner_id?: string;
  custodian_id?: string;
  department?: string;
  location?: string;
  // MAGERIT valuation (0-10)
  val_confidentiality: number;
  val_integrity: number;
  val_availability: number;
  val_authenticity: number;
  val_traceability: number;
  // Technical attributes
  ip_address?: string;
  hostname?: string;
  mac_address?: string;
  operating_system?: string;
  software_version?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  // Lifecycle
  acquisition_date?: string;
  warranty_expiry?: string;
  end_of_life?: string;
  disposal_date?: string;
  // Classification
  is_critical: boolean;
  data_classification?: DataClassification;
  pii_data: boolean;
  financial_data: boolean;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  category?: AssetCategory;
  owner?: Profile;
  custodian?: Profile;
  risks?: RiskScenario[];
  vulnerabilities?: Vulnerability[];
}

export interface AssetDependency {
  id: string;
  organization_id: string;
  asset_id: string;
  depends_on_asset_id: string;
  dependency_type: string;
  criticality: AssetCriticality;
  description?: string;
  created_by?: string;
  created_at: string;
  // Relations
  asset?: Asset;
  depends_on?: Asset;
}

// ---- MAGERIT 3.0 Risk Model ----

export interface ThreatCatalogEntry {
  id: string;
  organization_id?: string;
  code: string;
  name: string;
  description?: string;
  origin: ThreatOrigin;
  affected_dimensions: MageritDimension[];
  affected_asset_types: AssetType[];
  frequency_base: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Vulnerability {
  id: string;
  organization_id: string;
  code: string;
  cve_id?: string;
  title: string;
  description?: string;
  severity: VulnSeverity;
  cvss_base_score?: number;
  cvss_vector?: string;
  status: VulnStatus;
  source?: string;
  scanner_ref?: string;
  affected_product?: string;
  affected_version?: string;
  remediation?: string;
  exploit_available: boolean;
  patch_available: boolean;
  due_date?: string;
  resolved_at?: string;
  resolved_by?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  affected_assets?: Asset[];
  resolved_by_profile?: Profile;
}

export interface VulnerabilityAsset {
  id: string;
  organization_id: string;
  vulnerability_id: string;
  asset_id: string;
  status: VulnStatus;
  overridden_severity?: VulnSeverity;
  notes?: string;
  remediated_at?: string;
  remediated_by?: string;
  created_at: string;
  // Relations
  vulnerability?: Vulnerability;
  asset?: Asset;
}

export interface RiskScenario {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  asset_id: string;
  threat_id: string;
  // MAGERIT degradation per dimension (0-100%)
  degradation_c: number;
  degradation_i: number;
  degradation_a: number;
  degradation_au: number;
  degradation_t: number;
  // Frequency (0-5 MAGERIT scale)
  frequency: number;
  // Calculated impacts (asset_value * degradation)
  impact_c: number;
  impact_i: number;
  impact_a: number;
  impact_au: number;
  impact_t: number;
  impact_max: number;
  // Risk values
  risk_potential: number;
  safeguard_effectiveness: number;
  risk_residual: number;
  risk_level_inherent: RiskLevel;
  risk_level_residual: RiskLevel;
  // Treatment
  treatment: RiskTreatment;
  treatment_justification?: string;
  risk_owner_id?: string;
  accepted_by?: string;
  accepted_at?: string;
  review_date?: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  asset?: Asset;
  threat?: ThreatCatalogEntry;
  risk_owner?: Profile;
  accepted_by_profile?: Profile;
  controls?: Control[];
  vulnerabilities?: Vulnerability[];
  treatment_plans?: TreatmentPlan[];
}

export interface TreatmentPlan {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  risk_scenario_id: string;
  status: TreatmentPlanStatus;
  owner_id?: string;
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  budget?: number;
  budget_currency: string;
  expected_risk_reduction: number;
  actual_risk_reduction?: number;
  progress_percentage: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  risk_scenario?: RiskScenario;
  owner?: Profile;
  approved_by_profile?: Profile;
  actions?: TreatmentPlanAction[];
}

export interface TreatmentPlanAction {
  id: string;
  organization_id: string;
  treatment_plan_id: string;
  title: string;
  description?: string;
  responsible_id?: string;
  status: TreatmentPlanStatus;
  priority: number;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  cost_estimate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  treatment_plan?: TreatmentPlan;
  responsible?: Profile;
}

// ---- Frameworks & Compliance ----

export interface Framework {
  id: string;
  organization_id?: string;
  code: string;
  name: string;
  version?: string;
  description?: string;
  issuer?: string;
  published_date?: string;
  is_active: boolean;
  is_system: boolean;
  logo_url?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  domains?: FrameworkDomain[];
  requirements?: FrameworkRequirement[];
}

export interface FrameworkDomain {
  id: string;
  framework_id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  created_at: string;
  // Relations
  framework?: Framework;
  parent?: FrameworkDomain;
  children?: FrameworkDomain[];
  requirements?: FrameworkRequirement[];
}

export interface FrameworkRequirement {
  id: string;
  framework_id: string;
  domain_id?: string;
  code: string;
  title: string;
  description?: string;
  parent_id?: string;
  is_mandatory: boolean;
  guidance?: string;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  framework?: Framework;
  domain?: FrameworkDomain;
  parent?: FrameworkRequirement;
  children?: FrameworkRequirement[];
  controls?: Control[];
  mappings?: RequirementMapping[];
}

export interface RequirementMapping {
  id: string;
  organization_id?: string;
  source_requirement_id: string;
  target_requirement_id: string;
  strength: MappingStrength;
  notes?: string;
  created_by?: string;
  created_at: string;
  // Relations
  source_requirement?: FrameworkRequirement;
  target_requirement?: FrameworkRequirement;
}

// ---- Controls ----

export interface Control {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  objective?: string;
  control_type: ControlType;
  control_nature: ControlNature;
  automation: ControlAutomation;
  status: ControlStatus;
  implementation_date?: string;
  next_review_date?: string;
  owner_id?: string;
  responsible_id?: string;
  department?: string;
  implementation_notes?: string;
  testing_procedure?: string;
  frequency?: string;
  effectiveness_score?: number;
  last_tested_at?: string;
  last_tested_by?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  owner?: Profile;
  responsible?: Profile;
  requirements?: FrameworkRequirement[];
  risks?: RiskScenario[];
  soa_entry?: SOAEntry;
  evidence?: Evidence[];
}

export interface ControlRequirementMapping {
  id: string;
  organization_id: string;
  control_id: string;
  requirement_id: string;
  compliance_status: ComplianceStatus;
  coverage_percentage: number;
  notes?: string;
  last_assessed_at?: string;
  assessed_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  control?: Control;
  requirement?: FrameworkRequirement;
  assessed_by_profile?: Profile;
}

export interface ControlRiskMapping {
  id: string;
  organization_id: string;
  control_id: string;
  risk_scenario_id: string;
  effectiveness: number;
  notes?: string;
  created_at: string;
  // Relations
  control?: Control;
  risk_scenario?: RiskScenario;
}

export interface SOAEntry {
  id: string;
  organization_id: string;
  framework_id: string;
  requirement_id: string;
  control_id?: string;
  compliance_status: ComplianceStatus;
  applicability: boolean;
  inclusion_justification?: string;
  exclusion_justification?: string;
  implementation_description?: string;
  evidence_references?: string[];
  reviewed_by?: string;
  reviewed_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  framework?: Framework;
  requirement?: FrameworkRequirement;
  control?: Control;
  reviewed_by_profile?: Profile;
}

// ---- Incident Management ----

export interface Incident {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detected_at: string;
  reported_at?: string;
  triaged_at?: string;
  contained_at?: string;
  eradicated_at?: string;
  recovered_at?: string;
  closed_at?: string;
  detected_by?: string;
  reported_by?: string;
  incident_commander_id?: string;
  assigned_team?: string;
  // Impact assessment
  systems_affected?: string[];
  data_compromised: boolean;
  records_affected?: number;
  estimated_financial_impact?: number;
  regulatory_notification_required: boolean;
  regulatory_notified_at?: string;
  // Post-incident
  root_cause?: string;
  lessons_learned?: string;
  prevention_measures?: string;
  is_drill: boolean;
  source_ip?: string;
  attack_vector?: string;
  ioc_indicators?: string[];
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  detected_by_profile?: Profile;
  reported_by_profile?: Profile;
  commander?: Profile;
  timeline?: IncidentTimeline[];
  affected_assets?: Asset[];
  related_vulnerabilities?: Vulnerability[];
}

export interface IncidentTimeline {
  id: string;
  incident_id: string;
  occurred_at: string;
  action_type: string;
  title: string;
  description?: string;
  performed_by?: string;
  is_automated: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  // Relations
  incident?: Incident;
  performed_by_profile?: Profile;
}

export interface IncidentAsset {
  id: string;
  incident_id: string;
  asset_id: string;
  impact_description?: string;
  is_primary: boolean;
  created_at: string;
  // Relations
  incident?: Incident;
  asset?: Asset;
}

// ---- Non-Conformities & CAPA ----

export interface NonConformity {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description?: string;
  nc_type: NCType;
  status: NCStatus;
  source: string;
  source_ref?: string;
  detected_at: string;
  detected_by?: string;
  assigned_to?: string;
  department?: string;
  framework_id?: string;
  requirement_id?: string;
  control_id?: string;
  due_date?: string;
  closed_at?: string;
  closed_by?: string;
  root_cause?: string;
  root_cause_method?: string;
  immediate_action?: string;
  immediate_action_taken_at?: string;
  recurrence_risk: boolean;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  detected_by_profile?: Profile;
  assigned_to_profile?: Profile;
  closed_by_profile?: Profile;
  framework?: Framework;
  requirement?: FrameworkRequirement;
  control?: Control;
  capa_actions?: CAPAAction[];
}

export interface CAPAAction {
  id: string;
  organization_id: string;
  nonconformity_id: string;
  capa_type: CAPAType;
  title: string;
  description?: string;
  responsible_id?: string;
  status: TreatmentPlanStatus;
  priority: number;
  planned_date?: string;
  due_date?: string;
  completed_date?: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  effectiveness_rating?: number;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  nonconformity?: NonConformity;
  responsible?: Profile;
  verified_by_profile?: Profile;
}

// ---- Vendor Management ----

export interface Vendor {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  country?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  services_provided?: string[];
  risk_level: VendorRiskLevel;
  status: VendorStatus;
  is_critical: boolean;
  has_access_to_systems: boolean;
  has_access_to_data: boolean;
  data_classification_accessed?: DataClassification;
  contract_start?: string;
  contract_end?: string;
  sla_document_id?: string;
  contract_document_id?: string;
  annual_value?: number;
  owner_id?: string;
  last_assessment_date?: string;
  next_assessment_date?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  owner?: Profile;
  assessments?: VendorAssessment[];
}

export interface VendorAssessment {
  id: string;
  organization_id: string;
  vendor_id: string;
  assessment_date: string;
  assessor_id?: string;
  risk_level: VendorRiskLevel;
  overall_score?: number;
  security_score?: number;
  compliance_score?: number;
  operational_score?: number;
  findings?: string;
  recommendations?: string;
  next_review_date?: string;
  status: AuditStatus;
  approved_by?: string;
  approved_at?: string;
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  vendor?: Vendor;
  assessor?: Profile;
  approved_by_profile?: Profile;
}

// ---- Document Management ----

export interface Document {
  id: string;
  organization_id: string;
  code?: string;
  title: string;
  description?: string;
  document_type: DocumentType;
  status: DocumentStatus;
  owner_id?: string;
  reviewer_id?: string;
  approver_id?: string;
  current_version?: string;
  effective_date?: string;
  review_date?: string;
  expiry_date?: string;
  framework_ids?: string[];
  control_ids?: string[];
  is_template: boolean;
  is_public: boolean;
  data_classification: DataClassification;
  storage_path?: string;
  file_size?: number;
  file_type?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  owner?: Profile;
  reviewer?: Profile;
  approver?: Profile;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: string;
  change_summary?: string;
  storage_path: string;
  file_size?: number;
  file_type?: string;
  published_by?: string;
  published_at?: string;
  is_current: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  // Relations
  document?: Document;
  published_by_profile?: Profile;
}

export interface Evidence {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  evidence_type: EvidenceType;
  storage_path?: string;
  file_size?: number;
  file_type?: string;
  external_url?: string;
  collected_at: string;
  collected_by?: string;
  valid_from?: string;
  valid_until?: string;
  control_id?: string;
  requirement_id?: string;
  soa_entry_id?: string;
  is_automated: boolean;
  integration_source?: string;
  hash?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  collected_by_profile?: Profile;
  control?: Control;
  requirement?: FrameworkRequirement;
}

// ---- Audit Management ----

export interface AuditProgram {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  audit_type: AuditType;
  status: AuditStatus;
  lead_auditor_id?: string;
  team_members?: string[];
  framework_id?: string;
  scope?: string;
  objectives?: string;
  criteria?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  report_issued_at?: string;
  certifying_body?: string;
  certificate_number?: string;
  certificate_expiry?: string;
  overall_conclusion?: string;
  management_response?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  lead_auditor?: Profile;
  framework?: Framework;
  findings?: AuditFinding[];
}

export interface AuditFinding {
  id: string;
  organization_id: string;
  audit_program_id: string;
  code: string;
  title: string;
  description?: string;
  severity: FindingSeverity;
  requirement_id?: string;
  control_id?: string;
  evidence?: string;
  recommendation?: string;
  management_response?: string;
  agreed_action?: string;
  action_owner_id?: string;
  action_due_date?: string;
  action_completed_at?: string;
  is_repeat_finding: boolean;
  previous_finding_id?: string;
  nonconformity_id?: string;
  metadata: Record<string, unknown>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  audit_program?: AuditProgram;
  requirement?: FrameworkRequirement;
  control?: Control;
  action_owner?: Profile;
  nonconformity?: NonConformity;
}

// ---- Automation Engine ----

export interface AutomationRule {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  trigger: RuleTrigger;
  trigger_conditions: Record<string, unknown>;
  actions: AutomationRuleAction[];
  status: RuleStatus;
  priority: number;
  last_triggered_at?: string;
  trigger_count: number;
  error_count: number;
  last_error?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  created_by_profile?: Profile;
  executions?: AutomationExecution[];
}

export interface AutomationRuleAction {
  action: RuleAction;
  parameters: Record<string, unknown>;
  order: number;
}

export interface AutomationExecution {
  id: string;
  organization_id: string;
  rule_id: string;
  triggered_at: string;
  completed_at?: string;
  status: 'running' | 'success' | 'partial_success' | 'failed';
  trigger_payload: Record<string, unknown>;
  actions_executed: Record<string, unknown>[];
  error_details?: string;
  duration_ms?: number;
  created_at: string;
  // Relations
  rule?: AutomationRule;
}

// ---- Integration Connectors ----

export interface IntegrationConnector {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  integration_type: IntegrationType;
  status: IntegrationStatus;
  vendor_product?: string;
  endpoint_url?: string;
  auth_type?: string;
  config: Record<string, unknown>;
  secrets_ref?: string;
  sync_frequency_minutes?: number;
  last_sync_at?: string;
  last_sync_status?: string;
  last_sync_error?: string;
  total_events_processed: number;
  is_enabled: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  events?: IntegrationEvent[];
}

export interface IntegrationEvent {
  id: string;
  organization_id: string;
  connector_id: string;
  event_type: string;
  event_timestamp: string;
  raw_payload: Record<string, unknown>;
  normalized_payload?: Record<string, unknown>;
  processed: boolean;
  processed_at?: string;
  processing_error?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
  // Relations
  connector?: IntegrationConnector;
}

// ---- Audit Log & Notifications ----

export interface AuditLog {
  id: string;
  organization_id?: string;
  user_id?: string;
  action: AuditLogAction;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  session_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  // Relations
  user?: Profile;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  is_sent: boolean;
  sent_at?: string;
  send_error?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  // Relations
  user?: Profile;
}

export interface NotificationRule {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  trigger_event: string;
  conditions: Record<string, unknown>;
  recipient_type: 'user' | 'role' | 'department' | 'all';
  recipient_ids?: string[];
  channels: NotificationChannel[];
  template_subject?: string;
  template_body?: string;
  priority: NotificationPriority;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ---- Dashboard Metrics ----

export interface DashboardMetric {
  id: string;
  organization_id: string;
  category: MetricCategory;
  metric_key: string;
  metric_name: string;
  value: number;
  previous_value?: number;
  target_value?: number;
  unit?: string;
  trend: MetricTrend;
  period_start: string;
  period_end: string;
  breakdown?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  computed_at: string;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  organization_id: string;
  user_id?: string;
  widget_type: string;
  title: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_shared: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ---- Organization Clients (MSSP) ----

export interface OrgClient {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  tax_id?: string;
  industry?: string;
  country: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  account_manager_id?: string;
  is_active: boolean;
  service_start?: string;
  service_end?: string;
  plan_details?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  account_manager?: Profile;
}

// ========== DTOs ==========

// -- Organization DTOs --

export interface CreateOrganizationDTO {
  name: string;
  slug: string;
  tax_id?: string;
  industry?: string;
  country: string;
  address?: string;
  logo_url?: string;
  plan?: OrgPlan;
}

export interface UpdateOrganizationDTO {
  name?: string;
  tax_id?: string;
  industry?: string;
  country?: string;
  address?: string;
  logo_url?: string;
  plan?: OrgPlan;
  max_users?: number;
  max_assets?: number;
  settings?: Record<string, unknown>;
  is_active?: boolean;
  trial_ends_at?: string;
}

// -- Profile DTOs --

export interface UpdateProfileDTO {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  preferences?: Record<string, unknown>;
}

// -- Asset DTOs --

export interface CreateAssetDTO {
  code: string;
  name: string;
  description?: string;
  asset_type: AssetType;
  category_id?: string;
  status?: AssetStatus;
  criticality: AssetCriticality;
  owner_id?: string;
  custodian_id?: string;
  department?: string;
  location?: string;
  val_confidentiality?: number;
  val_integrity?: number;
  val_availability?: number;
  val_authenticity?: number;
  val_traceability?: number;
  ip_address?: string;
  hostname?: string;
  mac_address?: string;
  operating_system?: string;
  software_version?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  acquisition_date?: string;
  warranty_expiry?: string;
  end_of_life?: string;
  is_critical?: boolean;
  data_classification?: DataClassification;
  pii_data?: boolean;
  financial_data?: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateAssetDTO {
  name?: string;
  description?: string;
  asset_type?: AssetType;
  category_id?: string;
  status?: AssetStatus;
  criticality?: AssetCriticality;
  owner_id?: string;
  custodian_id?: string;
  department?: string;
  location?: string;
  val_confidentiality?: number;
  val_integrity?: number;
  val_availability?: number;
  val_authenticity?: number;
  val_traceability?: number;
  ip_address?: string;
  hostname?: string;
  mac_address?: string;
  operating_system?: string;
  software_version?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  acquisition_date?: string;
  warranty_expiry?: string;
  end_of_life?: string;
  disposal_date?: string;
  is_critical?: boolean;
  data_classification?: DataClassification;
  pii_data?: boolean;
  financial_data?: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Threat DTOs --

export interface CreateThreatCatalogEntryDTO {
  code: string;
  name: string;
  description?: string;
  origin: ThreatOrigin;
  affected_dimensions: MageritDimension[];
  affected_asset_types: AssetType[];
  frequency_base?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateThreatCatalogEntryDTO {
  name?: string;
  description?: string;
  origin?: ThreatOrigin;
  affected_dimensions?: MageritDimension[];
  affected_asset_types?: AssetType[];
  frequency_base?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

// -- Vulnerability DTOs --

export interface CreateVulnerabilityDTO {
  code: string;
  cve_id?: string;
  title: string;
  description?: string;
  severity: VulnSeverity;
  cvss_base_score?: number;
  cvss_vector?: string;
  source?: string;
  scanner_ref?: string;
  affected_product?: string;
  affected_version?: string;
  remediation?: string;
  exploit_available?: boolean;
  patch_available?: boolean;
  due_date?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  affected_asset_ids?: string[];
}

export interface UpdateVulnerabilityDTO {
  title?: string;
  description?: string;
  severity?: VulnSeverity;
  cvss_base_score?: number;
  cvss_vector?: string;
  status?: VulnStatus;
  remediation?: string;
  exploit_available?: boolean;
  patch_available?: boolean;
  due_date?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Risk DTOs --

export interface CreateRiskScenarioDTO {
  code: string;
  name: string;
  description?: string;
  asset_id: string;
  threat_id: string;
  degradation_c?: number;
  degradation_i?: number;
  degradation_a?: number;
  degradation_au?: number;
  degradation_t?: number;
  frequency?: number;
  treatment?: RiskTreatment;
  treatment_justification?: string;
  risk_owner_id?: string;
  review_date?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateRiskScenarioDTO {
  name?: string;
  description?: string;
  asset_id?: string;
  threat_id?: string;
  degradation_c?: number;
  degradation_i?: number;
  degradation_a?: number;
  degradation_au?: number;
  degradation_t?: number;
  frequency?: number;
  safeguard_effectiveness?: number;
  treatment?: RiskTreatment;
  treatment_justification?: string;
  risk_owner_id?: string;
  review_date?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Treatment Plan DTOs --

export interface CreateTreatmentPlanDTO {
  code: string;
  name: string;
  description?: string;
  risk_scenario_id: string;
  owner_id?: string;
  start_date?: string;
  target_date?: string;
  budget?: number;
  budget_currency?: string;
  expected_risk_reduction?: number;
  notes?: string;
}

export interface UpdateTreatmentPlanDTO {
  name?: string;
  description?: string;
  status?: TreatmentPlanStatus;
  owner_id?: string;
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  budget?: number;
  budget_currency?: string;
  expected_risk_reduction?: number;
  actual_risk_reduction?: number;
  progress_percentage?: number;
  notes?: string;
}

// -- Control DTOs --

export interface CreateControlDTO {
  code: string;
  name: string;
  description?: string;
  objective?: string;
  control_type: ControlType;
  control_nature: ControlNature;
  automation?: ControlAutomation;
  status?: ControlStatus;
  implementation_date?: string;
  next_review_date?: string;
  owner_id?: string;
  responsible_id?: string;
  department?: string;
  implementation_notes?: string;
  testing_procedure?: string;
  frequency?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  requirement_ids?: string[];
}

export interface UpdateControlDTO {
  name?: string;
  description?: string;
  objective?: string;
  control_type?: ControlType;
  control_nature?: ControlNature;
  automation?: ControlAutomation;
  status?: ControlStatus;
  implementation_date?: string;
  next_review_date?: string;
  owner_id?: string;
  responsible_id?: string;
  department?: string;
  implementation_notes?: string;
  testing_procedure?: string;
  frequency?: string;
  effectiveness_score?: number;
  last_tested_at?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Incident DTOs --

export interface CreateIncidentDTO {
  title: string;
  description?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  detected_at?: string;
  detected_by?: string;
  incident_commander_id?: string;
  systems_affected?: string[];
  data_compromised?: boolean;
  records_affected?: number;
  estimated_financial_impact?: number;
  regulatory_notification_required?: boolean;
  is_drill?: boolean;
  source_ip?: string;
  attack_vector?: string;
  ioc_indicators?: string[];
  affected_asset_ids?: string[];
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateIncidentDTO {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  incident_commander_id?: string;
  assigned_team?: string;
  systems_affected?: string[];
  data_compromised?: boolean;
  records_affected?: number;
  estimated_financial_impact?: number;
  regulatory_notification_required?: boolean;
  regulatory_notified_at?: string;
  root_cause?: string;
  lessons_learned?: string;
  prevention_measures?: string;
  ioc_indicators?: string[];
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Non-Conformity DTOs --

export interface CreateNonConformityDTO {
  title: string;
  description?: string;
  nc_type: NCType;
  source: string;
  source_ref?: string;
  detected_at?: string;
  detected_by?: string;
  assigned_to?: string;
  department?: string;
  framework_id?: string;
  requirement_id?: string;
  control_id?: string;
  due_date?: string;
  recurrence_risk?: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateNonConformityDTO {
  title?: string;
  description?: string;
  nc_type?: NCType;
  status?: NCStatus;
  assigned_to?: string;
  department?: string;
  due_date?: string;
  root_cause?: string;
  root_cause_method?: string;
  immediate_action?: string;
  immediate_action_taken_at?: string;
  recurrence_risk?: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Vendor DTOs --

export interface CreateVendorDTO {
  code: string;
  name: string;
  description?: string;
  country?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  services_provided?: string[];
  risk_level: VendorRiskLevel;
  is_critical?: boolean;
  has_access_to_systems?: boolean;
  has_access_to_data?: boolean;
  data_classification_accessed?: DataClassification;
  contract_start?: string;
  contract_end?: string;
  annual_value?: number;
  owner_id?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateVendorDTO {
  name?: string;
  description?: string;
  country?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  services_provided?: string[];
  risk_level?: VendorRiskLevel;
  status?: VendorStatus;
  is_critical?: boolean;
  has_access_to_systems?: boolean;
  has_access_to_data?: boolean;
  data_classification_accessed?: DataClassification;
  contract_start?: string;
  contract_end?: string;
  annual_value?: number;
  owner_id?: string;
  next_assessment_date?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Document DTOs --

export interface CreateDocumentDTO {
  code?: string;
  title: string;
  description?: string;
  document_type: DocumentType;
  owner_id?: string;
  reviewer_id?: string;
  approver_id?: string;
  effective_date?: string;
  review_date?: string;
  expiry_date?: string;
  framework_ids?: string[];
  control_ids?: string[];
  is_template?: boolean;
  is_public?: boolean;
  data_classification?: DataClassification;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateDocumentDTO {
  title?: string;
  description?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
  owner_id?: string;
  reviewer_id?: string;
  approver_id?: string;
  effective_date?: string;
  review_date?: string;
  expiry_date?: string;
  framework_ids?: string[];
  control_ids?: string[];
  is_template?: boolean;
  is_public?: boolean;
  data_classification?: DataClassification;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Audit DTOs --

export interface CreateAuditProgramDTO {
  code: string;
  name: string;
  description?: string;
  audit_type: AuditType;
  lead_auditor_id?: string;
  team_members?: string[];
  framework_id?: string;
  scope?: string;
  objectives?: string;
  criteria?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  certifying_body?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateAuditProgramDTO {
  name?: string;
  description?: string;
  status?: AuditStatus;
  lead_auditor_id?: string;
  team_members?: string[];
  scope?: string;
  objectives?: string;
  criteria?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  report_issued_at?: string;
  certifying_body?: string;
  certificate_number?: string;
  certificate_expiry?: string;
  overall_conclusion?: string;
  management_response?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// -- Automation DTOs --

export interface CreateAutomationRuleDTO {
  name: string;
  description?: string;
  trigger: RuleTrigger;
  trigger_conditions: Record<string, unknown>;
  actions: AutomationRuleAction[];
  status?: RuleStatus;
  priority?: number;
}

export interface UpdateAutomationRuleDTO {
  name?: string;
  description?: string;
  trigger?: RuleTrigger;
  trigger_conditions?: Record<string, unknown>;
  actions?: AutomationRuleAction[];
  status?: RuleStatus;
  priority?: number;
}

// -- Integration DTOs --

export interface CreateIntegrationConnectorDTO {
  name: string;
  description?: string;
  integration_type: IntegrationType;
  vendor_product?: string;
  endpoint_url?: string;
  auth_type?: string;
  config?: Record<string, unknown>;
  sync_frequency_minutes?: number;
  is_enabled?: boolean;
}

export interface UpdateIntegrationConnectorDTO {
  name?: string;
  description?: string;
  status?: IntegrationStatus;
  endpoint_url?: string;
  auth_type?: string;
  config?: Record<string, unknown>;
  sync_frequency_minutes?: number;
  is_enabled?: boolean;
}

// -- Evidence DTOs --

export interface CreateEvidenceDTO {
  title: string;
  description?: string;
  evidence_type: EvidenceType;
  external_url?: string;
  collected_at?: string;
  collected_by?: string;
  valid_from?: string;
  valid_until?: string;
  control_id?: string;
  requirement_id?: string;
  soa_entry_id?: string;
  is_automated?: boolean;
  integration_source?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// ========== RBAC ==========

export const MODULES = [
  'dashboard',
  'assets',
  'risks',
  'threats',
  'vulnerabilities',
  'controls',
  'compliance',
  'incidents',
  'nonconformities',
  'vendors',
  'documents',
  'audits',
  'automation',
  'integrations',
  'clients',
  'settings',
  'reports',
] as const;

export type Module = (typeof MODULES)[number];

export const ACTIONS = ['read', 'write', 'delete', 'approve', 'export'] as const;

export type Action = (typeof ACTIONS)[number];

export type ModulePermissions = Record<Action, boolean>;
export type PermissionMatrix = Record<Module, ModulePermissions>;

const allAllowed: ModulePermissions = {
  read: true,
  write: true,
  delete: true,
  approve: true,
  export: true,
};

const readOnly: ModulePermissions = {
  read: true,
  write: false,
  delete: false,
  approve: false,
  export: true,
};

const readWrite: ModulePermissions = {
  read: true,
  write: true,
  delete: false,
  approve: false,
  export: true,
};

const noAccess: ModulePermissions = {
  read: false,
  write: false,
  delete: false,
  approve: false,
  export: false,
};

export const SYSTEM_ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full platform access including settings and user management',
    permissions: {
      dashboard: allAllowed,
      assets: allAllowed,
      risks: allAllowed,
      threats: allAllowed,
      vulnerabilities: allAllowed,
      controls: allAllowed,
      compliance: allAllowed,
      incidents: allAllowed,
      nonconformities: allAllowed,
      vendors: allAllowed,
      documents: allAllowed,
      audits: allAllowed,
      automation: allAllowed,
      integrations: allAllowed,
      clients: allAllowed,
      settings: allAllowed,
      reports: allAllowed,
    } satisfies PermissionMatrix,
  },
  ciso: {
    name: 'CISO',
    description: 'Chief Information Security Officer - strategic oversight and approval authority',
    permissions: {
      dashboard: allAllowed,
      assets: allAllowed,
      risks: allAllowed,
      threats: allAllowed,
      vulnerabilities: allAllowed,
      controls: allAllowed,
      compliance: allAllowed,
      incidents: allAllowed,
      nonconformities: allAllowed,
      vendors: allAllowed,
      documents: allAllowed,
      audits: allAllowed,
      automation: readWrite,
      integrations: readWrite,
      clients: allAllowed,
      settings: readOnly,
      reports: allAllowed,
    } satisfies PermissionMatrix,
  },
  auditor: {
    name: 'Auditor',
    description: 'Internal or external auditor with read access and finding creation',
    permissions: {
      dashboard: readOnly,
      assets: readOnly,
      risks: readOnly,
      threats: readOnly,
      vulnerabilities: readOnly,
      controls: readOnly,
      compliance: readOnly,
      incidents: readOnly,
      nonconformities: readWrite,
      vendors: readOnly,
      documents: readOnly,
      audits: allAllowed,
      automation: noAccess,
      integrations: noAccess,
      clients: readOnly,
      settings: noAccess,
      reports: { read: true, write: false, delete: false, approve: false, export: true },
    } satisfies PermissionMatrix,
  },
  analyst: {
    name: 'Security Analyst',
    description: 'Operational security analyst managing incidents, vulnerabilities, and risks',
    permissions: {
      dashboard: readOnly,
      assets: readWrite,
      risks: readWrite,
      threats: readWrite,
      vulnerabilities: readWrite,
      controls: readWrite,
      compliance: readOnly,
      incidents: readWrite,
      nonconformities: readWrite,
      vendors: readOnly,
      documents: readWrite,
      audits: readOnly,
      automation: readOnly,
      integrations: readOnly,
      clients: readOnly,
      settings: noAccess,
      reports: { read: true, write: true, delete: false, approve: false, export: true },
    } satisfies PermissionMatrix,
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to all non-sensitive platform areas',
    permissions: {
      dashboard: readOnly,
      assets: readOnly,
      risks: readOnly,
      threats: readOnly,
      vulnerabilities: readOnly,
      controls: readOnly,
      compliance: readOnly,
      incidents: readOnly,
      nonconformities: readOnly,
      vendors: readOnly,
      documents: readOnly,
      audits: readOnly,
      automation: noAccess,
      integrations: noAccess,
      clients: readOnly,
      settings: noAccess,
      reports: { read: true, write: false, delete: false, approve: false, export: true },
    } satisfies PermissionMatrix,
  },
} as const;

export type SystemRoleName = keyof typeof SYSTEM_ROLES;

// ========== HELPER TYPES ==========

export type WithRelations<T, R extends Record<string, unknown>> = T & Partial<R>;

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: string;
  direction: SortDirection;
}

export interface FilterOption {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'is';
  value: unknown;
}

export interface QueryOptions {
  page?: number;
  page_size?: number;
  sort?: SortOption[];
  filters?: FilterOption[];
  search?: string;
}

// ========== MAGERIT CALCULATION HELPERS ==========

export interface MageritAssetValues {
  confidentiality: number;
  integrity: number;
  availability: number;
  authenticity: number;
  traceability: number;
}

export interface MageritRiskCalculation {
  asset_value_max: number;
  impact_by_dimension: MageritAssetValues;
  impact_max: number;
  frequency: number;
  risk_potential: number;
  safeguard_effectiveness: number;
  risk_residual: number;
  risk_level: RiskLevel;
}

export interface RiskHeatmapCell {
  frequency_label: string;
  frequency_value: number;
  impact_label: string;
  impact_value: number;
  risk_level: RiskLevel;
  scenarios: RiskScenario[];
}

// ========== DASHBOARD SUMMARY TYPES ==========

export interface RiskSummary {
  total: number;
  by_level: Record<RiskLevel, number>;
  by_treatment: Record<RiskTreatment, number>;
  overdue_review: number;
  recent_changes: number;
}

export interface ComplianceSummary {
  frameworks: number;
  overall_score: number;
  by_status: Record<ComplianceStatus, number>;
  controls_implemented: number;
  controls_total: number;
}

export interface VulnerabilitySummary {
  total: number;
  open: number;
  by_severity: Record<VulnSeverity, number>;
  overdue: number;
  mean_time_to_remediate_days: number;
}

export interface IncidentSummary {
  total: number;
  open: number;
  by_severity: Record<IncidentSeverity, number>;
  by_category: Record<IncidentCategory, number>;
  mean_time_to_detect_hours: number;
  mean_time_to_contain_hours: number;
}

export interface DashboardOverview {
  risk: RiskSummary;
  compliance: ComplianceSummary;
  vulnerabilities: VulnerabilitySummary;
  incidents: IncidentSummary;
  assets_total: number;
  assets_critical: number;
  vendors_critical: number;
  open_nonconformities: number;
  pending_audits: number;
}

// ========== SUPABASE DATABASE SCHEMA TYPES ==========

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: CreateOrganizationDTO;
        Update: UpdateOrganizationDTO;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: UpdateProfileDTO;
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Omit<OrganizationMember, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrganizationMember, 'id' | 'created_at'>>;
      };
      roles: {
        Row: Role;
        Insert: Omit<Role, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Role, 'id' | 'created_at'>>;
      };
      asset_categories: {
        Row: AssetCategory;
        Insert: Omit<AssetCategory, 'id' | 'created_at'>;
        Update: Partial<Omit<AssetCategory, 'id' | 'created_at'>>;
      };
      assets: {
        Row: Asset;
        Insert: CreateAssetDTO & { organization_id: string };
        Update: UpdateAssetDTO;
      };
      asset_dependencies: {
        Row: AssetDependency;
        Insert: Omit<AssetDependency, 'id' | 'created_at'>;
        Update: Partial<Omit<AssetDependency, 'id' | 'created_at'>>;
      };
      threat_catalog: {
        Row: ThreatCatalogEntry;
        Insert: CreateThreatCatalogEntryDTO & { organization_id?: string };
        Update: UpdateThreatCatalogEntryDTO;
      };
      vulnerabilities: {
        Row: Vulnerability;
        Insert: CreateVulnerabilityDTO & { organization_id: string };
        Update: UpdateVulnerabilityDTO;
      };
      vulnerability_assets: {
        Row: VulnerabilityAsset;
        Insert: Omit<VulnerabilityAsset, 'id' | 'created_at'>;
        Update: Partial<Omit<VulnerabilityAsset, 'id' | 'created_at'>>;
      };
      risk_scenarios: {
        Row: RiskScenario;
        Insert: CreateRiskScenarioDTO & { organization_id: string };
        Update: UpdateRiskScenarioDTO;
      };
      treatment_plans: {
        Row: TreatmentPlan;
        Insert: CreateTreatmentPlanDTO & { organization_id: string };
        Update: UpdateTreatmentPlanDTO;
      };
      treatment_plan_actions: {
        Row: TreatmentPlanAction;
        Insert: Omit<TreatmentPlanAction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TreatmentPlanAction, 'id' | 'created_at'>>;
      };
      frameworks: {
        Row: Framework;
        Insert: Omit<Framework, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Framework, 'id' | 'created_at'>>;
      };
      framework_domains: {
        Row: FrameworkDomain;
        Insert: Omit<FrameworkDomain, 'id' | 'created_at'>;
        Update: Partial<Omit<FrameworkDomain, 'id' | 'created_at'>>;
      };
      framework_requirements: {
        Row: FrameworkRequirement;
        Insert: Omit<FrameworkRequirement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FrameworkRequirement, 'id' | 'created_at'>>;
      };
      requirement_mappings: {
        Row: RequirementMapping;
        Insert: Omit<RequirementMapping, 'id' | 'created_at'>;
        Update: Partial<Omit<RequirementMapping, 'id' | 'created_at'>>;
      };
      controls: {
        Row: Control;
        Insert: CreateControlDTO & { organization_id: string };
        Update: UpdateControlDTO;
      };
      control_requirement_mappings: {
        Row: ControlRequirementMapping;
        Insert: Omit<ControlRequirementMapping, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ControlRequirementMapping, 'id' | 'created_at'>>;
      };
      control_risk_mappings: {
        Row: ControlRiskMapping;
        Insert: Omit<ControlRiskMapping, 'id' | 'created_at'>;
        Update: Partial<Omit<ControlRiskMapping, 'id' | 'created_at'>>;
      };
      soa_entries: {
        Row: SOAEntry;
        Insert: Omit<SOAEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SOAEntry, 'id' | 'created_at'>>;
      };
      incidents: {
        Row: Incident;
        Insert: CreateIncidentDTO & { organization_id: string };
        Update: UpdateIncidentDTO;
      };
      incident_timeline: {
        Row: IncidentTimeline;
        Insert: Omit<IncidentTimeline, 'id' | 'created_at'>;
        Update: Partial<Omit<IncidentTimeline, 'id' | 'created_at'>>;
      };
      incident_assets: {
        Row: IncidentAsset;
        Insert: Omit<IncidentAsset, 'id' | 'created_at'>;
        Update: Partial<Omit<IncidentAsset, 'id' | 'created_at'>>;
      };
      nonconformities: {
        Row: NonConformity;
        Insert: CreateNonConformityDTO & { organization_id: string };
        Update: UpdateNonConformityDTO;
      };
      capa_actions: {
        Row: CAPAAction;
        Insert: Omit<CAPAAction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CAPAAction, 'id' | 'created_at'>>;
      };
      vendors: {
        Row: Vendor;
        Insert: CreateVendorDTO & { organization_id: string };
        Update: UpdateVendorDTO;
      };
      vendor_assessments: {
        Row: VendorAssessment;
        Insert: Omit<VendorAssessment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<VendorAssessment, 'id' | 'created_at'>>;
      };
      documents: {
        Row: Document;
        Insert: CreateDocumentDTO & { organization_id: string };
        Update: UpdateDocumentDTO;
      };
      document_versions: {
        Row: DocumentVersion;
        Insert: Omit<DocumentVersion, 'id' | 'created_at'>;
        Update: Partial<Omit<DocumentVersion, 'id' | 'created_at'>>;
      };
      evidence: {
        Row: Evidence;
        Insert: CreateEvidenceDTO & { organization_id: string };
        Update: Partial<Omit<Evidence, 'id' | 'created_at'>>;
      };
      audit_programs: {
        Row: AuditProgram;
        Insert: CreateAuditProgramDTO & { organization_id: string };
        Update: UpdateAuditProgramDTO;
      };
      audit_findings: {
        Row: AuditFinding;
        Insert: Omit<AuditFinding, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AuditFinding, 'id' | 'created_at'>>;
      };
      automation_rules: {
        Row: AutomationRule;
        Insert: CreateAutomationRuleDTO & { organization_id: string };
        Update: UpdateAutomationRuleDTO;
      };
      automation_executions: {
        Row: AutomationExecution;
        Insert: Omit<AutomationExecution, 'id' | 'created_at'>;
        Update: Partial<Omit<AutomationExecution, 'id' | 'created_at'>>;
      };
      integration_connectors: {
        Row: IntegrationConnector;
        Insert: CreateIntegrationConnectorDTO & { organization_id: string };
        Update: UpdateIntegrationConnectorDTO;
      };
      integration_events: {
        Row: IntegrationEvent;
        Insert: Omit<IntegrationEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<IntegrationEvent, 'id' | 'created_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      notification_rules: {
        Row: NotificationRule;
        Insert: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationRule, 'id' | 'created_at'>>;
      };
      dashboard_metrics: {
        Row: DashboardMetric;
        Insert: Omit<DashboardMetric, 'id' | 'created_at'>;
        Update: never;
      };
      dashboard_widgets: {
        Row: DashboardWidget;
        Insert: Omit<DashboardWidget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DashboardWidget, 'id' | 'created_at'>>;
      };
      org_clients: {
        Row: OrgClient;
        Insert: Omit<OrgClient, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrgClient, 'id' | 'created_at'>>;
      };
    };
    Views: {
      risk_heatmap: {
        Row: {
          organization_id: string;
          risk_level: RiskLevel;
          frequency: number;
          impact_max: number;
          scenario_count: number;
        };
      };
      compliance_scorecard: {
        Row: {
          organization_id: string;
          framework_id: string;
          framework_name: string;
          total_requirements: number;
          compliant: number;
          partially_compliant: number;
          non_compliant: number;
          not_assessed: number;
          not_applicable: number;
          compliance_score: number;
        };
      };
      asset_risk_exposure: {
        Row: {
          organization_id: string;
          asset_id: string;
          asset_name: string;
          criticality: AssetCriticality;
          risk_count: number;
          max_residual_risk: number;
          dominant_risk_level: RiskLevel;
          open_vulnerability_count: number;
          critical_vulnerability_count: number;
        };
      };
    };
    Functions: {
      calculate_magerit_risk: {
        Args: {
          asset_value: number;
          degradation: number;
          frequency: number;
          safeguard_effectiveness: number;
        };
        Returns: number;
      };
      get_compliance_score: {
        Args: {
          org_id: string;
          framework_id: string;
        };
        Returns: number;
      };
      get_risk_level_from_value: {
        Args: {
          risk_value: number;
        };
        Returns: RiskLevel;
      };
    };
    Enums: {
      user_status: UserStatus;
      org_plan: OrgPlan;
      asset_type: AssetType;
      asset_status: AssetStatus;
      asset_criticality: AssetCriticality;
      magerit_dimension: MageritDimension;
      threat_origin: ThreatOrigin;
      risk_level: RiskLevel;
      risk_treatment: RiskTreatment;
      treatment_plan_status: TreatmentPlanStatus;
      control_status: ControlStatus;
      control_type: ControlType;
      control_nature: ControlNature;
      control_automation: ControlAutomation;
      compliance_status: ComplianceStatus;
      vuln_severity: VulnSeverity;
      vuln_status: VulnStatus;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
      incident_category: IncidentCategory;
      nc_type: NCType;
      nc_status: NCStatus;
      capa_type: CAPAType;
      vendor_risk_level: VendorRiskLevel;
      vendor_status: VendorStatus;
      document_type: DocumentType;
      document_status: DocumentStatus;
      audit_type: AuditType;
      audit_status: AuditStatus;
      finding_severity: FindingSeverity;
      rule_trigger: RuleTrigger;
      rule_action: RuleAction;
      rule_status: RuleStatus;
      integration_type: IntegrationType;
      integration_status: IntegrationStatus;
      audit_log_action: AuditLogAction;
      mapping_strength: MappingStrength;
      data_classification: DataClassification;
    };
  };
}
