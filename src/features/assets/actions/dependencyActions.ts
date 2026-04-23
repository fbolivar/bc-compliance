'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { writeAuditLog } from '@/shared/lib/audit';

export interface DependencyActionResult {
  ok: boolean;
  error?: string;
  data?: { id: string };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function int(formData: FormData, key: string, fallback = 0): number {
  const v = formData.get(key);
  const n = typeof v === 'string' ? parseInt(v, 10) : NaN;
  return isNaN(n) ? fallback : n;
}

export async function createDependency(formData: FormData): Promise<DependencyActionResult> {
  try {
    const { user, orgId } = await getCurrentOrg();
    if (!user) return { ok: false, error: 'No autenticado' };
    if (!orgId) return { ok: false, error: 'Sin organización activa' };

    const processId = str(formData, 'process_id');
    const name = str(formData, 'name');
    const kind = str(formData, 'kind') || 'Dependencia';
    const description = str(formData, 'description') || null;
    const sortOrder = int(formData, 'sort_order', 0);

    if (!processId) return { ok: false, error: 'Falta el proceso padre' };
    if (!name) return { ok: false, error: 'El nombre es obligatorio' };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('process_dependencies')
      .insert({
        organization_id: orgId,
        process_id: processId,
        name,
        kind,
        description,
        sort_order: sortOrder,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'Ya existe una dependencia con ese nombre en este proceso' };
      }
      return { ok: false, error: error.message };
    }

    await writeAuditLog({
      action: 'create',
      tableName: 'process_dependencies',
      recordId: data.id,
      description: `Creada dependencia "${name}" (${kind})`,
    });

    revalidatePath(`/assets/process/${processId}`);
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[createDependency]', err);
    return { ok: false, error: msg };
  }
}

export async function updateDependency(
  id: string,
  formData: FormData,
): Promise<DependencyActionResult> {
  try {
    const { user, orgId } = await getCurrentOrg();
    if (!user) return { ok: false, error: 'No autenticado' };
    if (!orgId) return { ok: false, error: 'Sin organización activa' };

    const name = str(formData, 'name');
    const kind = str(formData, 'kind') || 'Dependencia';
    const description = str(formData, 'description') || null;
    const sortOrder = int(formData, 'sort_order', 0);

    if (!name) return { ok: false, error: 'El nombre es obligatorio' };

    const supabase = await createClient();

    // Fetch existing to get process_id for revalidatePath
    const { data: existing } = await supabase
      .from('process_dependencies')
      .select('process_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    const { error } = await supabase
      .from('process_dependencies')
      .update({ name, kind, description, sort_order: sortOrder, updated_by: user.id })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'Ya existe una dependencia con ese nombre en este proceso' };
      }
      return { ok: false, error: error.message };
    }

    await writeAuditLog({
      action: 'update',
      tableName: 'process_dependencies',
      recordId: id,
      description: `Actualizada dependencia "${name}"`,
    });

    if (existing?.process_id) revalidatePath(`/assets/process/${existing.process_id}`);
    revalidatePath(`/assets/dependency/${id}`);
    return { ok: true, data: { id } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[updateDependency]', err);
    return { ok: false, error: msg };
  }
}

export async function deleteDependency(id: string): Promise<DependencyActionResult> {
  try {
    const { user, orgId } = await getCurrentOrg();
    if (!user) return { ok: false, error: 'No autenticado' };
    if (!orgId) return { ok: false, error: 'Sin organización activa' };

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('process_dependencies')
      .select('process_id, name')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    const { error } = await supabase
      .from('process_dependencies')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { ok: false, error: error.message };

    await writeAuditLog({
      action: 'delete',
      tableName: 'process_dependencies',
      recordId: id,
      description: `Eliminada dependencia "${existing?.name ?? id}"`,
    });

    if (existing?.process_id) revalidatePath(`/assets/process/${existing.process_id}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[deleteDependency]', err);
    return { ok: false, error: msg };
  }
}
