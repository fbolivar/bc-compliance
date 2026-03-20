'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'severity', 'status',
  'cvss_score', 'cve_id', 'affected_asset_id',
  'discovery_date', 'due_date', 'remediation_notes',
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
