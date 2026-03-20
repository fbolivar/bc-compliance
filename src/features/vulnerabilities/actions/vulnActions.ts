'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'title', 'description', 'severity', 'status',
  'cvss_base_score', 'cve_id', 'source',
  'due_date', 'remediation',
  'action_plan', 'action_responsible', 'action_priority', 'action_status',
];

export async function createVulnerability(formData: FormData): Promise<ActionResult> {
  return createEntity('vulnerabilities', formData, FIELDS, '/vulnerabilities');
}

export async function updateVulnerability(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('vulnerabilities', id, formData, FIELDS, '/vulnerabilities');
}

export async function deleteVulnerability(id: string): Promise<ActionResult> {
  return deleteEntity('vulnerabilities', id, '/vulnerabilities');
}
