'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createEntity, updateEntity, deleteEntity, getUserOrgId, type ActionResult } from '@/shared/lib/actions-helpers';

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

export async function markEventCompleted(id: string): Promise<ActionResult> {
  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organización activa' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('regulatory_events')
    .update({ status: 'completed' })
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) return { error: error.message };

  revalidatePath('/regulatory-calendar');
  return { success: true };
}
