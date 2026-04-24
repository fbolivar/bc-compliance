'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const BIA_FIELDS = [
  'process_name',
  'process_owner',
  'criticality',
  'mdt_hours',
  'rto_hours',
  'rpo_hours',
  'financial_impact',
  'operational_impact',
  'reputational_impact',
  'legal_impact',
  'dependencies',
  'notes',
];

export async function createBiaRecord(formData: FormData): Promise<ActionResult> {
  return createEntity('bia_records', formData, BIA_FIELDS, '/business-continuity');
}

export async function updateBiaRecord(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('bia_records', id, formData, BIA_FIELDS, '/business-continuity');
}

export async function deleteBiaRecord(id: string): Promise<ActionResult> {
  return deleteEntity('bia_records', id, '/business-continuity');
}
