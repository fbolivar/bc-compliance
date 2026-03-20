'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'title', 'description', 'type', 'severity', 'status',
  'source', 'detected_date', 'due_date', 'closure_date',
  'root_cause', 'corrective_action', 'preventive_action', 'responsible_id',
];

export async function createNC(formData: FormData): Promise<ActionResult> {
  return createEntity('nonconformities', formData, FIELDS, '/nonconformities');
}

export async function updateNC(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('nonconformities', id, formData, FIELDS, '/nonconformities');
}

export async function deleteNC(id: string): Promise<ActionResult> {
  return deleteEntity('nonconformities', id, '/nonconformities');
}
