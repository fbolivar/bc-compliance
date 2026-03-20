'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateOrganization(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = formData.get('org_id') as string;
  if (!orgId) return { error: 'Organizacion no encontrada' };

  const updates: Record<string, unknown> = {};
  const fields = ['name', 'slug', 'tax_id', 'industry', 'country', 'address'];
  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) updates[field] = val === '' ? null : val;
  }
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}
