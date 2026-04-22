'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'title', 'description', 'severity', 'status', 'category', 'source',
  'detected_at', 'triaged_at', 'contained_at', 'eradicated_at', 'recovered_at', 'closed_at',
  'root_cause', 'lessons_learned',
  'containment_actions', 'eradication_actions', 'recovery_actions',
  'reported_by', 'assigned_to',
];

export async function createIncident(formData: FormData): Promise<ActionResult> {
  return createEntity('incidents', formData, FIELDS, '/incidents');
}

export async function updateIncident(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('incidents', id, formData, FIELDS, '/incidents');
}

export async function deleteIncident(id: string): Promise<ActionResult> {
  return deleteEntity('incidents', id, '/incidents');
}
