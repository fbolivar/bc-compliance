'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'audit_type', 'scope', 'status',
  'lead_auditor', 'planned_start', 'planned_end',
  'actual_start', 'actual_end', 'framework_id', 'report_url',
];

export async function createAudit(formData: FormData): Promise<ActionResult> {
  return createEntity('audit_programs', formData, FIELDS, '/audits');
}

export async function updateAudit(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('audit_programs', id, formData, FIELDS, '/audits');
}

export async function deleteAudit(id: string): Promise<ActionResult> {
  return deleteEntity('audit_programs', id, '/audits');
}

// ── Findings ─────────────────────────────────────────────────────────────────

const FINDING_TEXT_FIELDS = [
  'code', 'title', 'description', 'severity', 'status',
  'clause_reference', 'finding_details', 'auditor_recommendation',
  'management_response', 'response_due_date',
] as const;

export async function createFinding(auditId: string, formData: FormData): Promise<ActionResult> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { error: 'Sin organización activa' };

  const payload: Record<string, unknown> = {
    organization_id: orgId,
    audit_id: auditId,
    status: 'open',
  };
  for (const field of FINDING_TEXT_FIELDS) {
    const v = (formData.get(field) as string | null)?.trim() ?? '';
    if (v) payload[field] = v;
  }
  if (!payload.code || !payload.title) return { error: 'Código y título son obligatorios' };

  const supabase = await createClient();
  const { error } = await supabase.from('audit_findings').insert(payload);
  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}`);
  return {};
}

export async function deleteFinding(findingId: string, auditId: string): Promise<ActionResult> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { error: 'Sin organización activa' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('audit_findings')
    .delete()
    .eq('id', findingId)
    .eq('organization_id', orgId);

  if (error) return { error: error.message };
  revalidatePath(`/audits/${auditId}`);
  return {};
}

export async function updateFindingStatus(findingId: string, status: string, auditId: string): Promise<ActionResult> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { error: 'Sin organización activa' };

  const update: Record<string, unknown> = { status };
  if (status === 'closed') update.closed_at = new Date().toISOString();

  const supabase = await createClient();
  const { error } = await supabase
    .from('audit_findings')
    .update(update)
    .eq('id', findingId)
    .eq('organization_id', orgId);

  if (error) return { error: error.message };
  revalidatePath(`/audits/${auditId}`);
  return {};
}
