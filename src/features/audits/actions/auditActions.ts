'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'audit_type', 'scope', 'status',
  'lead_auditor', 'planned_start', 'planned_end',
  'actual_start', 'actual_end', 'framework_id', 'report_url',
];

export async function createAudit(formData: FormData): Promise<ActionResult> {
  return createEntity('audits', formData, FIELDS, '/audits');
}

export async function updateAudit(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('audits', id, formData, FIELDS, '/audits');
}

export async function deleteAudit(id: string): Promise<ActionResult> {
  return deleteEntity('audits', id, '/audits');
}
