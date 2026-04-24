'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from './audit';
import { getCurrentOrg } from './get-org';

export type ActionResult = {
  success?: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserOrgId(): Promise<string | null> {
  const { orgId } = await getCurrentOrg();
  return orgId;
}

export async function createEntity(
  table: string,
  formData: FormData,
  fields: string[],
  revalidate: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const record: Record<string, unknown> = {
    organization_id: orgId,
    created_by: user.id,
  };

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      record[field] = value === '' ? null : value;
    }
  }

  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: table,
    recordId: (data as Record<string, unknown>)?.id as string,
    description: `Registro creado en ${table}`,
    newValues: record,
  });

  revalidatePath(revalidate);
  return { success: true, data: data as Record<string, unknown> };
}

export async function updateEntity(
  table: string,
  id: string,
  formData: FormData,
  fields: string[],
  revalidate: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const updates: Record<string, unknown> = {
    updated_by: user.id,
  };

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      updates[field] = value === '' ? null : value;
    }
  }

  const { error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: table,
    recordId: id,
    description: `Registro actualizado en ${table}`,
    newValues: updates,
  });

  revalidatePath(revalidate);
  return { success: true };
}

export async function deleteEntity(
  table: string,
  id: string,
  revalidate: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'delete',
    tableName: table,
    recordId: id,
    description: `Registro eliminado de ${table}`,
  });

  revalidatePath(revalidate);
  return { success: true };
}
