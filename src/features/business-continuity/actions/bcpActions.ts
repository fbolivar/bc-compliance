'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const PLAN_FIELDS = [
  'code',
  'title',
  'version',
  'status',
  'scope',
  'owner',
  'approved_by',
  'approved_at',
  'activation_criteria',
  'rto_target_hours',
  'rpo_target_hours',
  'last_test_date',
  'next_test_date',
  'notes',
];

export async function createBcpPlan(formData: FormData): Promise<ActionResult> {
  return createEntity('bcp_plans', formData, PLAN_FIELDS, '/business-continuity');
}

export async function updateBcpPlan(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('bcp_plans', id, formData, PLAN_FIELDS, '/business-continuity');
}

export async function deleteBcpPlan(id: string): Promise<ActionResult> {
  return deleteEntity('bcp_plans', id, '/business-continuity');
}
