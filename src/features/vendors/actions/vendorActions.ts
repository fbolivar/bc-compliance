'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'category', 'status', 'risk_level',
  'contact_name', 'contact_email', 'contact_phone', 'website', 'country',
  'contract_start', 'contract_end', 'sla_terms', 'data_processing',
  'last_assessment_date', 'next_assessment_date',
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
