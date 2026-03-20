'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/shared/lib/audit';
import type { ActionResult } from '@/shared/lib/actions-helpers';

export async function createThreat(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // Get org id
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!membership) return { error: 'Sin organizacion' };

  const name = (formData.get('name') as string)?.trim();
  const description = formData.get('description') as string;
  const origin = formData.get('origin') as string;
  const dimensionsRaw = formData.getAll('affected_dimensions') as string[];

  if (!name || !origin) return { error: 'Nombre y origen son requeridos' };

  // Generate sequential code for org-owned threats
  const { data: lastThreat } = await supabase
    .from('threat_catalog')
    .select('code')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (lastThreat?.code) {
    const match = lastThreat.code.match(/CUST-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const code = `CUST-${String(nextNum).padStart(3, '0')}`;

  const { error } = await supabase
    .from('threat_catalog')
    .insert({
      organization_id: membership.organization_id,
      code,
      name,
      description: description || null,
      origin,
      affected_dimensions: dimensionsRaw.length > 0 ? dimensionsRaw : ['confidentiality'],
      frequency_base: parseInt(formData.get('frequency_base') as string) || 1,
      is_active: true,
    });

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'threat_catalog',
    description: `Amenaza personalizada creada: ${name}`,
  });

  revalidatePath('/threats');
  return { success: true };
}

export async function updateThreat(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const name = (formData.get('name') as string)?.trim();
  const description = formData.get('description') as string;
  const origin = formData.get('origin') as string;
  const dimensionsRaw = formData.getAll('affected_dimensions') as string[];

  if (!name || !origin) return { error: 'Nombre y origen son requeridos' };

  const { error } = await supabase
    .from('threat_catalog')
    .update({
      name,
      description: description || null,
      origin,
      affected_dimensions: dimensionsRaw.length > 0 ? dimensionsRaw : ['confidentiality'],
      frequency_base: parseInt(formData.get('frequency_base') as string) || 1,
    })
    .eq('id', id);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'threat_catalog',
    recordId: id,
    description: `Amenaza actualizada: ${name}`,
  });

  revalidatePath('/threats');
  return { success: true };
}

export async function deleteThreat(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // Prevent deletion of system (MAGERIT catalog) threats
  const { data: threat } = await supabase
    .from('threat_catalog')
    .select('organization_id, name')
    .eq('id', id)
    .single();

  if (!threat) return { error: 'Amenaza no encontrada' };
  if (!threat.organization_id) return { error: 'No se pueden eliminar amenazas del catalogo MAGERIT' };

  const { error } = await supabase
    .from('threat_catalog')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'threat_catalog',
    recordId: id,
    description: `Amenaza eliminada: ${threat.name}`,
  });

  revalidatePath('/threats');
  return { success: true };
}
