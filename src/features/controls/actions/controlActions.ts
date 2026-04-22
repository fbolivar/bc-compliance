'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'objective',
  'control_type', 'control_nature', 'automation_level',
  'status', 'department',
  'design_effectiveness', 'operating_effectiveness', 'overall_effectiveness',
  'execution_frequency', 'next_review_date', 'implementation_date',
  'implementation_notes', 'is_key_control',
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
