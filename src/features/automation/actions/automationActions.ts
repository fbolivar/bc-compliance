'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'trigger_type',
  'action_type', 'is_active',
];

export async function createAutomationRule(formData: FormData): Promise<ActionResult> {
  return createEntity('automation_rules', formData, FIELDS, '/automation/rules');
}

export async function updateAutomationRule(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('automation_rules', id, formData, FIELDS, '/automation/rules');
}

export async function deleteAutomationRule(id: string): Promise<ActionResult> {
  return deleteEntity('automation_rules', id, '/automation/rules');
}
