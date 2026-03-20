'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const ASSET_FIELDS = [
  'code', 'name', 'description', 'asset_type', 'status', 'criticality',
  'department', 'location', 'ip_address', 'hostname', 'operating_system',
  'software_version', 'serial_number', 'manufacturer', 'model',
  'val_confidentiality', 'val_integrity', 'val_availability',
  'val_authenticity', 'val_traceability', 'is_critical',
  'data_classification', 'pii_data', 'financial_data',
];

export async function createAsset(formData: FormData): Promise<ActionResult> {
  return createEntity('assets', formData, ASSET_FIELDS, '/assets');
}

export async function updateAsset(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('assets', id, formData, ASSET_FIELDS, '/assets');
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  return deleteEntity('assets', id, '/assets');
}
