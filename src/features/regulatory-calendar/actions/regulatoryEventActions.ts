'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'title', 'description', 'authority', 'event_type',
  'due_date', 'recurrence', 'status', 'framework_ref', 'notes',
];

export async function createRegulatoryEvent(formData: FormData): Promise<ActionResult> {
  return createEntity('regulatory_events', formData, FIELDS, '/regulatory-calendar');
}

export async function updateRegulatoryEvent(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('regulatory_events', id, formData, FIELDS, '/regulatory-calendar');
}

export async function deleteRegulatoryEvent(id: string): Promise<ActionResult> {
  return deleteEntity('regulatory_events', id, '/regulatory-calendar');
}
