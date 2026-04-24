'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'title', 'description', 'policy_type', 'status', 'version',
  'owner', 'approved_by', 'approved_at', 'effective_date', 'review_date',
  'content', 'notes',
];

export async function createPolicy(formData: FormData): Promise<ActionResult> {
  return createEntity('policies', formData, FIELDS, '/policies');
}

export async function updatePolicy(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('policies', id, formData, FIELDS, '/policies');
}

export async function deletePolicy(id: string): Promise<ActionResult> {
  return deleteEntity('policies', id, '/policies');
}
