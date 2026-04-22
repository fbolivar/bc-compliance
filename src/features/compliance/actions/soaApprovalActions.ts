'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserOrgId } from '@/shared/lib/actions-helpers';
import { writeAuditLog } from '@/shared/lib/audit';

export type ActionResult = { success?: boolean; error?: string };

const COMPLIANCE_MAP: Record<string, string> = {
  implemented: 'compliant',
  partially_implemented: 'partially_compliant',
  not_implemented: 'non_compliant',
  planned: 'non_compliant',
  not_applicable: 'not_applicable',
};

/**
 * Propone un cambio al SOA. Va a estado pending_status (no afecta el campo
 * canónico hasta que un aprobador lo valide).
 */
export async function proposeSoaChange(
  entryId: string,
  newImplementationStatus: string,
  justification?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organización' };

  const { data: entry } = await supabase
    .from('soa_entries')
    .select('id, organization_id, implementation_status, compliance_status, justification')
    .eq('id', entryId)
    .single();
  if (!entry || entry.organization_id !== orgId) return { error: 'Entrada SOA no encontrada' };

  const newComp = COMPLIANCE_MAP[newImplementationStatus] ?? 'not_assessed';

  const { error } = await supabase
    .from('soa_entries')
    .update({
      pending_status: newImplementationStatus,
      pending_compliance_status: newComp,
      pending_justification: justification ?? entry.justification,
      pending_changed_by: user.id,
      pending_changed_at: new Date().toISOString(),
    })
    .eq('id', entryId);
  if (error) return { error: error.message };

  // Change log entry
  await supabase.from('soa_change_log').insert({
    organization_id: orgId,
    soa_entry_id: entryId,
    requirement_id: (await supabase.from('soa_entries').select('requirement_id').eq('id', entryId).single()).data?.requirement_id,
    changed_by: user.id,
    change_type: 'proposed',
    old_implementation_status: entry.implementation_status,
    new_implementation_status: newImplementationStatus,
    old_compliance_status: entry.compliance_status,
    new_compliance_status: newComp,
    notes: justification ?? null,
  });

  await writeAuditLog({
    action: 'update',
    tableName: 'soa_entries',
    recordId: entryId,
    description: `SOA cambio propuesto: ${entry.implementation_status} → ${newImplementationStatus}`,
  });

  revalidatePath('/compliance/soa');
  revalidatePath('/compliance/soa/approvals');
  return { success: true };
}

/**
 * Aprueba un cambio pendiente. Lo aplica al campo canónico y limpia pending.
 */
export async function approveSoaChange(entryId: string, approvalNotes?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organización' };

  const { data: entry } = await supabase
    .from('soa_entries')
    .select('*')
    .eq('id', entryId)
    .single();
  if (!entry || entry.organization_id !== orgId) return { error: 'Entrada SOA no encontrada' };
  if (!entry.pending_status) return { error: 'No hay cambio pendiente que aprobar' };

  const { error } = await supabase
    .from('soa_entries')
    .update({
      implementation_status: entry.pending_status,
      compliance_status: entry.pending_compliance_status,
      justification: entry.pending_justification ?? entry.justification,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      pending_status: null,
      pending_compliance_status: null,
      pending_justification: null,
      pending_changed_by: null,
      pending_changed_at: null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_notes: approvalNotes?.trim() || null,
    })
    .eq('id', entryId);
  if (error) return { error: error.message };

  await supabase.from('soa_change_log').insert({
    organization_id: orgId,
    soa_entry_id: entryId,
    requirement_id: entry.requirement_id,
    changed_by: user.id,
    change_type: 'approved',
    old_implementation_status: entry.implementation_status,
    new_implementation_status: entry.pending_status,
    old_compliance_status: entry.compliance_status,
    new_compliance_status: entry.pending_compliance_status,
    notes: approvalNotes ?? null,
  });

  await writeAuditLog({
    action: 'update',
    tableName: 'soa_entries',
    recordId: entryId,
    description: `SOA cambio aprobado por ${user.email}`,
  });

  revalidatePath('/compliance/soa');
  revalidatePath('/compliance/soa/approvals');
  return { success: true };
}

export async function rejectSoaChange(entryId: string, reason: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organización' };

  const { data: entry } = await supabase
    .from('soa_entries')
    .select('id, organization_id, implementation_status, compliance_status, requirement_id, pending_status, pending_compliance_status')
    .eq('id', entryId)
    .single();
  if (!entry || entry.organization_id !== orgId) return { error: 'Entrada no encontrada' };
  if (!entry.pending_status) return { error: 'Sin cambio pendiente' };

  const { error } = await supabase
    .from('soa_entries')
    .update({
      pending_status: null,
      pending_compliance_status: null,
      pending_justification: null,
      pending_changed_by: null,
      pending_changed_at: null,
    })
    .eq('id', entryId);
  if (error) return { error: error.message };

  await supabase.from('soa_change_log').insert({
    organization_id: orgId,
    soa_entry_id: entryId,
    requirement_id: entry.requirement_id,
    changed_by: user.id,
    change_type: 'rejected',
    old_implementation_status: entry.implementation_status,
    new_implementation_status: entry.pending_status,
    old_compliance_status: entry.compliance_status,
    new_compliance_status: entry.pending_compliance_status,
    notes: reason,
  });

  await writeAuditLog({
    action: 'update',
    tableName: 'soa_entries',
    recordId: entryId,
    description: `SOA cambio rechazado por ${user.email}: ${reason}`,
  });

  revalidatePath('/compliance/soa/approvals');
  return { success: true };
}
