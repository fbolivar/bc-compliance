'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createEntity, updateEntity, deleteEntity, getUserOrgId, type ActionResult } from '@/shared/lib/actions-helpers';

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

export async function approvePolicy(id: string, approvedBy: string): Promise<ActionResult> {
  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organización activa' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('policies')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) return { error: error.message };

  revalidatePath('/policies');
  revalidatePath(`/policies/${id}`);
  return { success: true };
}
