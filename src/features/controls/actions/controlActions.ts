'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'control_type', 'category',
  'status', 'implementation_level', 'effectiveness', 'owner',
  'frequency', 'last_review_date', 'next_review_date',
  'evidence_required', 'automation_level',
];

export async function createControl(formData: FormData): Promise<ActionResult> {
  return createEntity('controls', formData, FIELDS, '/controls');
}

export async function updateControl(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('controls', id, formData, FIELDS, '/controls');
}

export async function deleteControl(id: string): Promise<ActionResult> {
  return deleteEntity('controls', id, '/controls');
}
