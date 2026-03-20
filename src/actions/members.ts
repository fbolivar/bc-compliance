'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/shared/lib/audit';

export async function toggleMemberStatus(memberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: member } = await supabase
    .from('organization_members')
    .select('is_active, user_id')
    .eq('id', memberId)
    .single();

  if (!member) return { error: 'Miembro no encontrado' };

  const newStatus = !member.is_active;
  const { error } = await supabase
    .from('organization_members')
    .update({ is_active: newStatus })
    .eq('id', memberId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'organization_members',
    recordId: memberId,
    description: `Miembro ${newStatus ? 'activado' : 'desactivado'}`,
  });

  revalidatePath('/settings/users');
  return { success: true };
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: 'organization_members',
    recordId: memberId,
    description: 'Miembro eliminado de la organizacion',
  });

  revalidatePath('/settings/users');
  return { success: true };
}
