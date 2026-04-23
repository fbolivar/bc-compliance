'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { writeAuditLog } from '@/shared/lib/audit';
import type { ActionResult } from '@/shared/lib/actions-helpers';

const ASSET_FIELDS = [
  'code', 'name', 'description', 'asset_type', 'status', 'criticality',
  'category_id',
  'department', 'location', 'ip_address', 'hostname', 'operating_system',
  'software_version', 'serial_number', 'manufacturer', 'model',
  'val_confidentiality', 'val_integrity', 'val_availability',
  'val_authenticity', 'val_traceability', 'is_critical',
  'data_classification', 'pii_data', 'financial_data',
  // PNNC / MAGERIT extended fields (from migration 00006)
  'process_type', 'process_name', 'sede', 'asset_id_custom', 'trd_serie',
  'info_generation_date', 'entry_date', 'exit_date', 'language', 'format',
  'support', 'consultation_place', 'info_owner', 'info_custodian',
  'update_frequency', 'icc_social_impact', 'icc_economic_impact',
  'icc_environmental_impact', 'icc_is_critical',
  'confidentiality', 'integrity', 'availability',
  'confidentiality_value', 'integrity_value', 'availability_value',
  'exception_objective', 'constitutional_basis', 'legal_exception_basis',
  'exception_scope', 'classification_date', 'classification_term',
  'contains_personal_data', 'contains_minors_data', 'personal_data_type',
  'personal_data_purpose', 'has_data_authorization',
];

function buildRecord(formData: FormData, fields: string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      record[field] = value === '' ? null : value;
    }
  }
  return record;
}

export async function createAsset(formData: FormData): Promise<ActionResult> {
  try {
    const { user, orgId } = await getCurrentOrg();
    if (!user) return { error: 'No autenticado' };
    if (!orgId) return { error: 'Sin organización activa' };

    const supabase = await createClient();
    const record = buildRecord(formData, ASSET_FIELDS);
    record.organization_id = orgId;
    record.created_by = user.id;
    record.updated_by = user.id;

    const { data, error } = await supabase
      .from('assets')
      .insert(record)
      .select('id, code, name')
      .single();

    if (error) return { error: error.message };

    await writeAuditLog({
      action: 'create',
      tableName: 'assets',
      recordId: data.id,
      description: `Creado activo "${data.name}" (${data.code})`,
      newValues: record,
    });

    revalidatePath('/assets');
    return { success: true, data: data as Record<string, unknown> };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[createAsset]', err);
    return { error: msg };
  }
}

export async function updateAsset(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const { user, orgId } = await getCurrentOrg();
    if (!user) return { error: 'No autenticado' };
    if (!orgId) return { error: 'Sin organización activa' };

    const supabase = await createClient();
    const updates = buildRecord(formData, ASSET_FIELDS);
    updates.updated_by = user.id;

    const { error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };

    await writeAuditLog({
      action: 'update',
      tableName: 'assets',
      recordId: id,
      description: `Actualizado activo ${id}`,
      newValues: updates,
    });

    revalidatePath('/assets');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[updateAsset]', err);
    return { error: msg };
  }
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  try {
    const { orgId } = await getCurrentOrg();
    if (!orgId) return { error: 'Sin organización activa' };

    const supabase = await createClient();
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };

    await writeAuditLog({
      action: 'delete',
      tableName: 'assets',
      recordId: id,
      description: `Eliminado activo ${id}`,
    });

    revalidatePath('/assets');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[deleteAsset]', err);
    return { error: msg };
  }
}
