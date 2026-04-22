import { createClient } from '@/lib/supabase/server';

// ─── Risk ↔ Vulnerability ────────────────────────────────────────────────────

export interface RelatedVulnerability {
  mapping_id: string;
  vulnerability_id: string;
  code: string;
  title: string;
  severity: string;
  status: string;
  cvss_base_score: number | null;
  contribution_factor: number;
  notes: string | null;
}

export async function getVulnerabilitiesForRisk(riskId: string): Promise<RelatedVulnerability[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('risk_vulnerabilities')
    .select(`
      id, contribution_factor, notes,
      vulnerabilities(id, code, title, severity, status, cvss_base_score)
    `)
    .eq('risk_scenario_id', riskId)
    .order('contribution_factor', { ascending: false });

  if (error || !data) return [];
  type Row = {
    id: string;
    contribution_factor: number | null;
    notes: string | null;
    vulnerabilities: { id: string; code: string; title: string; severity: string; status: string; cvss_base_score: number | null } | null;
  };
  return (data as unknown as Row[]).filter((r) => r.vulnerabilities).map((r) => ({
    mapping_id: r.id,
    vulnerability_id: r.vulnerabilities!.id,
    code: r.vulnerabilities!.code,
    title: r.vulnerabilities!.title,
    severity: r.vulnerabilities!.severity,
    status: r.vulnerabilities!.status,
    cvss_base_score: r.vulnerabilities!.cvss_base_score,
    contribution_factor: r.contribution_factor ?? 0,
    notes: r.notes,
  }));
}

export interface RelatedRisk {
  mapping_id: string;
  risk_id: string;
  code: string;
  name: string;
  risk_level_residual: string;
  risk_residual: number;
  treatment: string;
  contribution_factor?: number;
  notes?: string | null;
}

export async function getRisksForVulnerability(vulnerabilityId: string): Promise<RelatedRisk[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('risk_vulnerabilities')
    .select(`
      id, contribution_factor, notes,
      risk_scenarios(id, code, name, risk_level_residual, risk_residual, treatment)
    `)
    .eq('vulnerability_id', vulnerabilityId);

  if (error || !data) return [];
  type Row = {
    id: string;
    contribution_factor: number | null;
    notes: string | null;
    risk_scenarios: { id: string; code: string; name: string; risk_level_residual: string; risk_residual: number; treatment: string } | null;
  };
  return (data as unknown as Row[]).filter((r) => r.risk_scenarios).map((r) => ({
    mapping_id: r.id,
    risk_id: r.risk_scenarios!.id,
    code: r.risk_scenarios!.code,
    name: r.risk_scenarios!.name,
    risk_level_residual: r.risk_scenarios!.risk_level_residual,
    risk_residual: r.risk_scenarios!.risk_residual,
    treatment: r.risk_scenarios!.treatment,
    contribution_factor: r.contribution_factor ?? 0,
    notes: r.notes,
  }));
}

export interface AvailableVulnerability {
  id: string;
  code: string;
  title: string;
  severity: string;
}

export async function getAvailableVulnerabilitiesForRisk(
  orgId: string,
  riskId: string,
): Promise<AvailableVulnerability[]> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('risk_vulnerabilities')
    .select('vulnerability_id')
    .eq('risk_scenario_id', riskId);
  const excludedIds = (existing ?? []).map((r) => r.vulnerability_id);

  let query = supabase
    .from('vulnerabilities')
    .select('id, code, title, severity')
    .eq('organization_id', orgId)
    .order('severity', { ascending: false });

  if (excludedIds.length > 0) query = query.not('id', 'in', `(${excludedIds.join(',')})`);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AvailableVulnerability[];
}

export interface AvailableRiskOption {
  id: string;
  code: string;
  name: string;
  risk_level_residual: string;
}

export async function getAvailableRisksForVulnerability(
  orgId: string,
  vulnerabilityId: string,
): Promise<AvailableRiskOption[]> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('risk_vulnerabilities')
    .select('risk_scenario_id')
    .eq('vulnerability_id', vulnerabilityId);
  const excludedIds = (existing ?? []).map((r) => r.risk_scenario_id);

  let query = supabase
    .from('risk_scenarios')
    .select('id, code, name, risk_level_residual')
    .eq('organization_id', orgId)
    .order('code');

  if (excludedIds.length > 0) query = query.not('id', 'in', `(${excludedIds.join(',')})`);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AvailableRiskOption[];
}

// ─── Incident ↔ Risk / Asset ─────────────────────────────────────────────────

export interface IncidentRiskItem {
  mapping_id: string;
  risk_id: string;
  code: string;
  name: string;
  risk_level_residual: string;
  notes: string | null;
}

export async function getRisksForIncident(incidentId: string): Promise<IncidentRiskItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('incident_risks')
    .select('id, notes, risk_scenarios(id, code, name, risk_level_residual)')
    .eq('incident_id', incidentId);

  if (error || !data) return [];
  type Row = { id: string; notes: string | null; risk_scenarios: { id: string; code: string; name: string; risk_level_residual: string } | null };
  return (data as unknown as Row[]).filter((r) => r.risk_scenarios).map((r) => ({
    mapping_id: r.id,
    risk_id: r.risk_scenarios!.id,
    code: r.risk_scenarios!.code,
    name: r.risk_scenarios!.name,
    risk_level_residual: r.risk_scenarios!.risk_level_residual,
    notes: r.notes,
  }));
}

export async function getAvailableRisksForIncident(
  orgId: string,
  incidentId: string,
): Promise<AvailableRiskOption[]> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('incident_risks')
    .select('risk_scenario_id')
    .eq('incident_id', incidentId);
  const excludedIds = (existing ?? []).map((r) => r.risk_scenario_id);

  let query = supabase
    .from('risk_scenarios')
    .select('id, code, name, risk_level_residual')
    .eq('organization_id', orgId)
    .order('code');

  if (excludedIds.length > 0) query = query.not('id', 'in', `(${excludedIds.join(',')})`);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AvailableRiskOption[];
}

export interface IncidentAssetItem {
  mapping_id: string;
  asset_id: string;
  code: string;
  name: string;
  asset_type: string;
  criticality: string;
  impact_description: string | null;
}

export async function getAssetsForIncident(incidentId: string): Promise<IncidentAssetItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('incident_assets')
    .select('id, impact_description, assets(id, code, name, asset_type, criticality)')
    .eq('incident_id', incidentId);

  if (error || !data) return [];
  type Row = { id: string; impact_description: string | null; assets: { id: string; code: string; name: string; asset_type: string; criticality: string } | null };
  return (data as unknown as Row[]).filter((r) => r.assets).map((r) => ({
    mapping_id: r.id,
    asset_id: r.assets!.id,
    code: r.assets!.code,
    name: r.assets!.name,
    asset_type: r.assets!.asset_type,
    criticality: r.assets!.criticality,
    impact_description: r.impact_description,
  }));
}

export interface AvailableAsset {
  id: string;
  code: string;
  name: string;
  asset_type: string;
  criticality: string;
}

export async function getAvailableAssetsForIncident(
  orgId: string,
  incidentId: string,
): Promise<AvailableAsset[]> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('incident_assets')
    .select('asset_id')
    .eq('incident_id', incidentId);
  const excludedIds = (existing ?? []).map((r) => r.asset_id);

  let query = supabase
    .from('assets')
    .select('id, code, name, asset_type, criticality')
    .eq('organization_id', orgId)
    .order('code');

  if (excludedIds.length > 0) query = query.not('id', 'in', `(${excludedIds.join(',')})`);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AvailableAsset[];
}

// ─── Treatment Plan ↔ Risk ───────────────────────────────────────────────────

export interface RiskTreatmentPlan {
  mapping_id: string;
  treatment_plan_id: string;
  code: string;
  title: string;
  status: string;
  target_date: string | null;
}

export async function getTreatmentPlansForRisk(riskId: string): Promise<RiskTreatmentPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('treatment_plan_risks')
    .select('id, treatment_plans(id, code, title, status, target_date)')
    .eq('risk_scenario_id', riskId);

  if (error || !data) return [];
  type Row = { id: string; treatment_plans: { id: string; code: string; title: string; status: string; target_date: string | null } | null };
  return (data as unknown as Row[]).filter((r) => r.treatment_plans).map((r) => ({
    mapping_id: r.id,
    treatment_plan_id: r.treatment_plans!.id,
    code: r.treatment_plans!.code,
    title: r.treatment_plans!.title,
    status: r.treatment_plans!.status,
    target_date: r.treatment_plans!.target_date,
  }));
}

export interface AvailableTreatmentPlan {
  id: string;
  code: string;
  title: string;
  status: string;
}

export async function getAvailableTreatmentPlansForRisk(
  orgId: string,
  riskId: string,
): Promise<AvailableTreatmentPlan[]> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('treatment_plan_risks')
    .select('treatment_plan_id')
    .eq('risk_scenario_id', riskId);
  const excludedIds = (existing ?? []).map((r) => r.treatment_plan_id);

  let query = supabase
    .from('treatment_plans')
    .select('id, code, title, status')
    .eq('organization_id', orgId)
    .order('code');

  if (excludedIds.length > 0) query = query.not('id', 'in', `(${excludedIds.join(',')})`);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AvailableTreatmentPlan[];
}
