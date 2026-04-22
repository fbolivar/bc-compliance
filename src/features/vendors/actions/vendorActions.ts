'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'vendor_type', 'status', 'risk_level',
  'contact_name', 'contact_email', 'contact_phone', 'website', 'country', 'tax_id',
  'data_location',
  'handles_pii', 'handles_financial_data',
  'has_dpa', 'dpa_signed_at',
  'has_iso27001', 'has_soc2', 'has_pentest',
  'last_assessment_date', 'next_assessment_date', 'risk_score',
  'contract_start', 'contract_end', 'contract_value',
  'notes',
];

export async function createVendor(formData: FormData): Promise<ActionResult> {
  return createEntity('vendors', formData, FIELDS, '/vendors');
}

export async function updateVendor(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('vendors', id, formData, FIELDS, '/vendors');
}

export async function deleteVendor(id: string): Promise<ActionResult> {
  return deleteEntity('vendors', id, '/vendors');
}
