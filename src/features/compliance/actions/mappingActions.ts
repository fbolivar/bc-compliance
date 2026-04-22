'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserOrgId } from '@/shared/lib/actions-helpers';
import { writeAuditLog } from '@/shared/lib/audit';

export type ActionResult = {
  success?: boolean;
  error?: string;
};

const COMPLIANCE_FROM_COVERAGE = (coverage: number): string => {
  if (coverage >= 90) return 'compliant';
  if (coverage >= 50) return 'partially_compliant';
  return 'non_compliant';
};

// ─── Control ↔ Risk ──────────────────────────────────────────────────────────

export async function linkControlToRisk(input: {
  controlId: string;
  riskId: string;
  effectiveness: number;
  notes?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const effectiveness = Math.max(0, Math.min(100, Math.round(input.effectiveness)));

  const { error } = await supabase
    .from('control_risk_mappings')
    .upsert(
      {
        organization_id: orgId,
        control_id: input.controlId,
        risk_scenario_id: input.riskId,
        effectiveness,
        notes: input.notes?.trim() || null,
      },
      { onConflict: 'control_id,risk_scenario_id' },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'control_risk_mappings',
    description: `Control vinculado a riesgo (efectividad ${effectiveness}%)`,
  });

  revalidatePath(`/risks/${input.riskId}`);
  revalidatePath(`/controls/${input.controlId}`);
  return { success: true };
}

export async function unlinkControlFromRisk(mappingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('control_risk_mappings')
    .select('control_id, risk_scenario_id')
    .eq('id', mappingId)
    .single();

  const { error } = await supabase
    .from('control_risk_mappings')
    .delete()
    .eq('id', mappingId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'control_risk_mappings',
    recordId: mappingId,
    description: 'Vinculo control-riesgo eliminado',
  });

  if (existing?.risk_scenario_id) revalidatePath(`/risks/${existing.risk_scenario_id}`);
  if (existing?.control_id) revalidatePath(`/controls/${existing.control_id}`);
  return { success: true };
}

// ─── Control ↔ Requirement ───────────────────────────────────────────────────

export async function linkControlToRequirement(input: {
  controlId: string;
  requirementId: string;
  coveragePercentage: number;
  justification?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const coverage = Math.max(0, Math.min(100, Math.round(input.coveragePercentage)));
  const compliance_status = COMPLIANCE_FROM_COVERAGE(coverage);

  const { error } = await supabase
    .from('control_requirement_mappings')
    .upsert(
      {
        organization_id: orgId,
        control_id: input.controlId,
        requirement_id: input.requirementId,
        coverage_percentage: coverage,
        compliance_status,
        justification: input.justification?.trim() || null,
      },
      { onConflict: 'control_id,requirement_id' },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'control_requirement_mappings',
    description: `Control vinculado a requisito (cobertura ${coverage}%)`,
  });

  revalidatePath(`/controls/${input.controlId}`);
  revalidatePath('/compliance');
  return { success: true };
}

export async function unlinkControlFromRequirement(mappingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('control_requirement_mappings')
    .select('control_id')
    .eq('id', mappingId)
    .single();

  const { error } = await supabase
    .from('control_requirement_mappings')
    .delete()
    .eq('id', mappingId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'control_requirement_mappings',
    recordId: mappingId,
    description: 'Vinculo control-requisito eliminado',
  });

  if (existing?.control_id) revalidatePath(`/controls/${existing.control_id}`);
  revalidatePath('/compliance');
  return { success: true };
}

// ─── Risk ↔ Vulnerability ────────────────────────────────────────────────────

export async function linkRiskToVulnerability(input: {
  riskId: string;
  vulnerabilityId: string;
  contributionFactor: number;
  notes?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const contribution = Math.max(0, Math.min(100, Math.round(input.contributionFactor)));

  const { error } = await supabase
    .from('risk_vulnerabilities')
    .upsert(
      {
        organization_id: orgId,
        risk_scenario_id: input.riskId,
        vulnerability_id: input.vulnerabilityId,
        contribution_factor: contribution,
        notes: input.notes?.trim() || null,
      },
      { onConflict: 'risk_scenario_id,vulnerability_id' },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'risk_vulnerabilities',
    description: `Vulnerabilidad vinculada a riesgo (contribucion ${contribution}%)`,
  });

  revalidatePath(`/risks/${input.riskId}`);
  revalidatePath(`/vulnerabilities/${input.vulnerabilityId}`);
  return { success: true };
}

export async function unlinkRiskFromVulnerability(mappingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('risk_vulnerabilities')
    .select('risk_scenario_id, vulnerability_id')
    .eq('id', mappingId)
    .single();

  const { error } = await supabase
    .from('risk_vulnerabilities')
    .delete()
    .eq('id', mappingId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'risk_vulnerabilities',
    recordId: mappingId,
    description: 'Vinculo riesgo-vulnerabilidad eliminado',
  });

  if (existing?.risk_scenario_id) revalidatePath(`/risks/${existing.risk_scenario_id}`);
  if (existing?.vulnerability_id) revalidatePath(`/vulnerabilities/${existing.vulnerability_id}`);
  return { success: true };
}

// ─── Incident ↔ Risk ─────────────────────────────────────────────────────────

export async function linkIncidentToRisk(input: {
  incidentId: string;
  riskId: string;
  notes?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('incident_risks')
    .upsert(
      {
        incident_id: input.incidentId,
        risk_scenario_id: input.riskId,
        notes: input.notes?.trim() || null,
      },
      { onConflict: 'incident_id,risk_scenario_id' },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'incident_risks',
    description: 'Riesgo vinculado a incidente',
  });

  revalidatePath(`/incidents/${input.incidentId}`);
  revalidatePath(`/risks/${input.riskId}`);
  return { success: true };
}

export async function unlinkIncidentFromRisk(mappingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('incident_risks')
    .select('incident_id, risk_scenario_id')
    .eq('id', mappingId)
    .single();

  const { error } = await supabase.from('incident_risks').delete().eq('id', mappingId);
  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'incident_risks',
    recordId: mappingId,
    description: 'Vinculo incidente-riesgo eliminado',
  });

  if (existing?.incident_id) revalidatePath(`/incidents/${existing.incident_id}`);
  if (existing?.risk_scenario_id) revalidatePath(`/risks/${existing.risk_scenario_id}`);
  return { success: true };
}

// ─── Incident ↔ Asset ────────────────────────────────────────────────────────

export async function linkIncidentToAsset(input: {
  incidentId: string;
  assetId: string;
  impactDescription?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('incident_assets')
    .upsert(
      {
        incident_id: input.incidentId,
        asset_id: input.assetId,
        impact_description: input.impactDescription?.trim() || null,
      },
      { onConflict: 'incident_id,asset_id' },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'incident_assets',
    description: 'Activo vinculado a incidente',
  });

  revalidatePath(`/incidents/${input.incidentId}`);
  revalidatePath(`/assets/${input.assetId}`);
  return { success: true };
}

export async function unlinkIncidentFromAsset(mappingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('incident_assets')
    .select('incident_id, asset_id')
    .eq('id', mappingId)
    .single();

  const { error } = await supabase.from('incident_assets').delete().eq('id', mappingId);
  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'incident_assets',
    recordId: mappingId,
    description: 'Vinculo incidente-activo eliminado',
  });

  if (existing?.incident_id) revalidatePath(`/incidents/${existing.incident_id}`);
  if (existing?.asset_id) revalidatePath(`/assets/${existing.asset_id}`);
  return { success: true };
}

// ─── Treatment Plan ↔ Risk ───────────────────────────────────────────────────

export async function linkTreatmentPlanToRisk(input: {
  treatmentPlanId: string;
  riskId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('treatment_plan_risks')
    .upsert(
      {
        treatment_plan_id: input.treatmentPlanId,
        risk_scenario_id: input.riskId,
      },
      { onConflict: 'treatment_plan_id,risk_scenario_id' },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'treatment_plan_risks',
    description: 'Riesgo vinculado a plan de tratamiento',
  });

  revalidatePath(`/risks/${input.riskId}`);
  revalidatePath('/risks/treatment-plans');
  return { success: true };
}

// ─── Cross-framework Requirement Mapping ─────────────────────────────────────

export async function linkRequirements(input: {
  sourceRequirementId: string;
  targetRequirementId: string;
  mappingStrength: string; // 'equivalent' | 'similar' | 'partial' | 'related'
  notes?: string;
}): Promise<ActionResult> {
  if (input.sourceRequirementId === input.targetRequirementId) {
    return { error: 'El requisito origen y destino deben ser distintos.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('requirement_mappings')
    .upsert(
      {
        source_requirement_id: input.sourceRequirementId,
        target_requirement_id: input.targetRequirementId,
        mapping_strength: input.mappingStrength,
        notes: input.notes?.trim() || null,
      },
      { onConflict: 'source_requirement_id,target_requirement_id' },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'requirement_mappings',
    description: `Mapeo cross-framework creado (${input.mappingStrength})`,
  });

  revalidatePath('/compliance/cross-framework');
  return { success: true };
}

export async function unlinkRequirements(mappingId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('requirement_mappings').delete().eq('id', mappingId);
  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'requirement_mappings',
    recordId: mappingId,
    description: 'Mapeo cross-framework eliminado',
  });

  revalidatePath('/compliance/cross-framework');
  return { success: true };
}

export async function unlinkTreatmentPlanFromRisk(mappingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('treatment_plan_risks')
    .select('risk_scenario_id')
    .eq('id', mappingId)
    .single();

  const { error } = await supabase.from('treatment_plan_risks').delete().eq('id', mappingId);
  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'treatment_plan_risks',
    recordId: mappingId,
    description: 'Vinculo plan-riesgo eliminado',
  });

  if (existing?.risk_scenario_id) revalidatePath(`/risks/${existing.risk_scenario_id}`);
  revalidatePath('/risks/treatment-plans');
  return { success: true };
}
