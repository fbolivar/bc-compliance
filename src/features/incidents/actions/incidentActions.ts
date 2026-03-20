'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'title', 'description', 'severity', 'status', 'category',
  'detection_date', 'containment_date', 'resolution_date',
  'impact_description', 'root_cause', 'lessons_learned',
  'reporter_id', 'assignee_id',
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
