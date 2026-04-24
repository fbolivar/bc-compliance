'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const TEST_FIELDS = [
  'bcp_plan_id',
  'test_date',
  'test_type',
  'result',
  'rto_achieved_hours',
  'rpo_achieved_hours',
  'findings',
  'improvements',
  'conducted_by',
];

export async function createBcpTest(formData: FormData): Promise<ActionResult> {
  return createEntity('bcp_tests', formData, TEST_FIELDS, '/business-continuity');
}

export async function updateBcpTest(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('bcp_tests', id, formData, TEST_FIELDS, '/business-continuity');
}

export async function deleteBcpTest(id: string): Promise<ActionResult> {
  return deleteEntity('bcp_tests', id, '/business-continuity');
}
