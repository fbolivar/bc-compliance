'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const RISK_FIELDS = [
  'code', 'name', 'description', 'asset_id', 'category_id', 'threat_id',
  'degradation_c', 'degradation_i', 'degradation_a', 'degradation_au', 'degradation_t',
  'frequency', 'treatment', 'treatment_justification', 'review_date',
  // DAFP 2020 fields (migration 00014)
  'causes', 'consequences', 'risk_type', 'activity_frequency',
  'probability_label', 'probability_value', 'impact_label', 'impact_value', 'risk_zone',
];

export async function createRisk(formData: FormData): Promise<ActionResult> {
  return createEntity('risk_scenarios', formData, RISK_FIELDS, '/risks');
}

export async function updateRisk(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('risk_scenarios', id, formData, RISK_FIELDS, '/risks');
}

export async function deleteRisk(id: string): Promise<ActionResult> {
  return deleteEntity('risk_scenarios', id, '/risks');
}
