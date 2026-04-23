'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

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

export async function createAsset(formData: FormData): Promise<ActionResult> {
  return createEntity('assets', formData, ASSET_FIELDS, '/assets');
}

export async function updateAsset(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('assets', id, formData, ASSET_FIELDS, '/assets');
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  return deleteEntity('assets', id, '/assets');
}
