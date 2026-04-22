'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/shared/lib/audit';

export type ActionResult = {
  success?: boolean;
  error?: string;
};

const COMPLIANCE_MAP: Record<string, string> = {
  implemented: 'compliant',
  partially_implemented: 'partially_compliant',
  not_implemented: 'non_compliant',
  planned: 'non_compliant',
  not_applicable: 'not_applicable',
};

function revalidateCompliancePaths() {
  revalidatePath('/compliance');
  revalidatePath('/compliance/soa');
  revalidatePath('/compliance/gap-analysis');
}

export async function updateSoaEntry(
  entryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const implementation_status = formData.get('implementation_status') as string;
  const is_applicable = formData.get('is_applicable') === 'true';
  const justification = formData.get('justification') as string;
  const notes = formData.get('notes') as string;

  const compliance_status = is_applicable
    ? (COMPLIANCE_MAP[implementation_status] ?? 'not_assessed')
    : 'not_applicable';

  const { error } = await supabase
    .from('soa_entries')
    .update({
      implementation_status: implementation_status || 'not_implemented',
      compliance_status,
      is_applicable,
      justification: justification || '',
      notes: notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', entryId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'soa_entries',
    recordId: entryId,
    description: `SOA entry actualizada: ${implementation_status}`,
  });

  revalidateCompliancePaths();
  return { success: true };
}

interface DeriveOutcome {
  soaEntryId: string;
  requirementId: string;
  implementation_status: string;
  compliance_status: string;
  mappedControlsCount: number;
  avgCoverage: number;
}

async function computeDerivedStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  requirementId: string,
): Promise<Omit<DeriveOutcome, 'soaEntryId' | 'requirementId'> | null> {
  const { data: mappings } = await supabase
    .from('control_requirement_mappings')
    .select('coverage_percentage, controls(status)')
    .eq('organization_id', orgId)
    .eq('requirement_id', requirementId);

  type Row = { coverage_percentage: number; controls: { status: string } | null };
  const rows = (mappings as unknown as Row[] | null) ?? [];
  const valid = rows.filter((r) => r.controls);

  if (valid.length === 0) {
    return {
      implementation_status: 'not_implemented',
      compliance_status: 'non_compliant',
      mappedControlsCount: 0,
      avgCoverage: 0,
    };
  }

  const totalCoverage = valid.reduce((sum, r) => sum + (r.coverage_percentage ?? 0), 0);
  const avgCoverage = Math.round(totalCoverage / valid.length);
  const statuses = valid.map((r) => r.controls!.status);

  const allImplemented = statuses.every((s) => s === 'implemented');
  const allNotImplemented = statuses.every((s) => s === 'not_implemented');
  const anyImplemented = statuses.some(
    (s) => s === 'implemented' || s === 'partially_implemented',
  );

  let implementation_status: string;
  let compliance_status: string;

  if (allImplemented && avgCoverage >= 90) {
    implementation_status = 'implemented';
    compliance_status = 'compliant';
  } else if (allNotImplemented) {
    implementation_status = 'not_implemented';
    compliance_status = 'non_compliant';
  } else if (anyImplemented) {
    implementation_status = 'partially_implemented';
    compliance_status = 'partially_compliant';
  } else {
    implementation_status = 'planned';
    compliance_status = 'non_compliant';
  }

  return { implementation_status, compliance_status, mappedControlsCount: valid.length, avgCoverage };
}

export async function deriveSoaFromControls(
  entryId: string,
): Promise<ActionResult & { outcome?: DeriveOutcome }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: entry } = await supabase
    .from('soa_entries')
    .select('id, organization_id, requirement_id, is_applicable')
    .eq('id', entryId)
    .single();

  if (!entry) return { error: 'Entrada SOA no encontrada' };

  // Respeta "no aplica"
  if (!entry.is_applicable) {
    return { success: true };
  }

  const derived = await computeDerivedStatus(
    supabase,
    entry.organization_id,
    entry.requirement_id,
  );

  if (!derived) return { error: 'No se pudo calcular el estado' };

  const { error } = await supabase
    .from('soa_entries')
    .update({
      implementation_status: derived.implementation_status,
      compliance_status: derived.compliance_status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', entryId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'soa_entries',
    recordId: entryId,
    description: `SOA derivado automaticamente: ${derived.implementation_status} (${derived.mappedControlsCount} ctrls, cobertura ${derived.avgCoverage}%)`,
  });

  revalidateCompliancePaths();
  return {
    success: true,
    outcome: { soaEntryId: entryId, requirementId: entry.requirement_id, ...derived },
  };
}

export async function deriveSoaBulk(entryIds: string[]): Promise<ActionResult & { updated?: number }> {
  let updated = 0;
  for (const id of entryIds) {
    const res = await deriveSoaFromControls(id);
    if (res.success) updated++;
  }
  revalidateCompliancePaths();
  return { success: true, updated };
}

export async function bulkUpdateSoaStatus(
  entryIds: string[],
  status: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('soa_entries')
    .update({
      implementation_status: status,
      compliance_status: COMPLIANCE_MAP[status] ?? 'not_assessed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .in('id', entryIds);

  if (error) return { error: error.message };

  revalidateCompliancePaths();
  return { success: true };
}
