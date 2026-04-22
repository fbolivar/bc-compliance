'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'title', 'description', 'nc_type', 'status',
  'source', 'source_ref_id', 'source_ref_type',
  'raised_by', 'assigned_to',
  'detected_at', 'target_close_date', 'closed_at',
  'verified_by',
  'root_cause', 'root_cause_method',
  'framework_id', 'requirement_id', 'control_id',
  'notes',
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
