import { createClient } from '@/lib/supabase/server';

export interface IntegrationKPIs {
  // Counts
  totalRisks: number;
  risksWithControls: number;
  risksWithoutControls: number;
  risksWithTreatmentPlan: number;
  risksWithoutTreatmentPlan: number;

  totalControls: number;
  controlsWithRequirement: number;
  controlsWithoutRequirement: number;
  controlsWithRisk: number;
  controlsWithoutRisk: number;

  totalVulnerabilities: number;
  vulnerabilitiesLinkedToRisks: number;

  totalIncidents: number;
  incidentsLinkedToRisks: number;

  crossFrameworkMappings: number;

  // Top 5 gaps
  topRisksWithoutControls: Array<{ id: string; code: string; name: string; risk_level_residual: string }>;
  topControlsWithoutRequirement: Array<{ id: string; code: string; name: string; status: string }>;
}

export async function getIntegrationKPIs(orgId: string): Promise<IntegrationKPIs> {
  const supabase = await createClient();

  // Parallel fetches
  const [
    risksRes,
    controlsRes,
    vulnsCountRes,
    incidentsCountRes,
    crossMapsCountRes,
    controlRiskMapsRes,
    controlReqMapsRes,
    riskVulnMapsRes,
    planRiskMapsRes,
    incidentRiskMapsRes,
  ] = await Promise.all([
    supabase.from('risk_scenarios').select('id, code, name, risk_level_residual').eq('organization_id', orgId),
    supabase.from('controls').select('id, code, name, status').eq('organization_id', orgId),
    supabase.from('vulnerabilities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('requirement_mappings').select('id', { count: 'exact', head: true }),
    supabase.from('control_risk_mappings').select('control_id, risk_scenario_id').eq('organization_id', orgId),
    supabase.from('control_requirement_mappings').select('control_id').eq('organization_id', orgId),
    supabase.from('risk_vulnerabilities').select('risk_scenario_id, vulnerability_id').eq('organization_id', orgId),
    supabase.from('treatment_plan_risks').select('risk_scenario_id'),
    supabase.from('incident_risks').select('incident_id, risk_scenario_id'),
  ]);

  const risks = (risksRes.data ?? []) as Array<{ id: string; code: string; name: string; risk_level_residual: string }>;
  const controls = (controlsRes.data ?? []) as Array<{ id: string; code: string; name: string; status: string }>;
  const crmRows = (controlRiskMapsRes.data ?? []) as Array<{ control_id: string; risk_scenario_id: string }>;
  const ctrlReqRows = (controlReqMapsRes.data ?? []) as Array<{ control_id: string }>;
  const riskVulnRows = (riskVulnMapsRes.data ?? []) as Array<{ risk_scenario_id: string; vulnerability_id: string }>;
  const planRiskRows = (planRiskMapsRes.data ?? []) as Array<{ risk_scenario_id: string }>;
  const incidentRiskRows = (incidentRiskMapsRes.data ?? []) as Array<{ incident_id: string; risk_scenario_id: string }>;

  // Sets for quick lookup
  const riskIdsWithControls = new Set(crmRows.map((r) => r.risk_scenario_id));
  const controlIdsWithRisk = new Set(crmRows.map((r) => r.control_id));
  const controlIdsWithReq = new Set(ctrlReqRows.map((r) => r.control_id));
  const riskIdsWithPlan = new Set(planRiskRows.map((r) => r.risk_scenario_id));
  const vulnIdsLinked = new Set(riskVulnRows.map((r) => r.vulnerability_id));
  const incidentIdsLinked = new Set(incidentRiskRows.map((r) => r.incident_id));

  const totalRisks = risks.length;
  const risksWithControls = risks.filter((r) => riskIdsWithControls.has(r.id)).length;
  const risksWithoutControls = totalRisks - risksWithControls;

  const totalControls = controls.length;
  const controlsWithRisk = controls.filter((c) => controlIdsWithRisk.has(c.id)).length;
  const controlsWithRequirement = controls.filter((c) => controlIdsWithReq.has(c.id)).length;

  const risksWithTreatmentPlan = risks.filter((r) => riskIdsWithPlan.has(r.id)).length;

  // Top 5 gaps — prioritize critical/high residual risks
  const levelOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, negligible: 0 };
  const topRisksWithoutControls = risks
    .filter((r) => !riskIdsWithControls.has(r.id))
    .sort((a, b) => (levelOrder[b.risk_level_residual] ?? 0) - (levelOrder[a.risk_level_residual] ?? 0))
    .slice(0, 5);

  const topControlsWithoutRequirement = controls
    .filter((c) => !controlIdsWithReq.has(c.id))
    .slice(0, 5);

  return {
    totalRisks,
    risksWithControls,
    risksWithoutControls,
    risksWithTreatmentPlan,
    risksWithoutTreatmentPlan: totalRisks - risksWithTreatmentPlan,

    totalControls,
    controlsWithRequirement,
    controlsWithoutRequirement: totalControls - controlsWithRequirement,
    controlsWithRisk,
    controlsWithoutRisk: totalControls - controlsWithRisk,

    totalVulnerabilities: vulnsCountRes.count ?? 0,
    vulnerabilitiesLinkedToRisks: vulnIdsLinked.size,

    totalIncidents: incidentsCountRes.count ?? 0,
    incidentsLinkedToRisks: incidentIdsLinked.size,

    crossFrameworkMappings: crossMapsCountRes.count ?? 0,

    topRisksWithoutControls,
    topControlsWithoutRequirement,
  };
}
