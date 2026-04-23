import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface AssetRow {
  id: string;
  organization_id: string;
  category_id: string | null;
  code: string;
  name: string;
  description: string | null;
  asset_type: string;
  status: string;
  criticality: string;
  criticality_cid: string | null;
  // Section 1: Identification (PNNC)
  process_type: string | null;
  process_name: string | null;
  sede: string | null;
  asset_id_custom: string | null;
  trd_serie: string | null;
  info_generation_date: string | null;
  entry_date: string | null;
  exit_date: string | null;
  language: string | null;
  format: string | null;
  // Section 1.2: Location
  support: string | null;
  consultation_place: string | null;
  // Section 1.3: Ownership
  info_owner: string | null;
  info_custodian: string | null;
  update_frequency: string | null;
  // Section 2: ICC (Infraestructura Crítica Cibernética)
  icc_social_impact: boolean | null;
  icc_economic_impact: boolean | null;
  icc_environmental_impact: boolean | null;
  icc_is_critical: boolean | null;
  // Section 3: CIA classification
  confidentiality: string | null;
  integrity: string | null;
  availability: string | null;
  confidentiality_value: number | null;
  integrity_value: number | null;
  availability_value: number | null;
  total_value: string | null;
  // Section 4: Ley 1712 (Información clasificada y reservada)
  exception_objective: string | null;
  constitutional_basis: string | null;
  legal_exception_basis: string | null;
  exception_scope: string | null;
  classification_date: string | null;
  classification_term: string | null;
  // Section 5: Ley 1581 (Datos personales)
  contains_personal_data: boolean | null;
  contains_minors_data: boolean | null;
  personal_data_type: string | null;
  personal_data_purpose: string | null;
  has_data_authorization: boolean | null;
  // Legacy / technical fields
  department: string | null;
  location: string | null;
  ip_address: string | null;
  hostname: string | null;
  val_confidentiality: number;
  val_integrity: number;
  val_availability: number;
  val_authenticity: number;
  val_traceability: number;
  is_critical: boolean;
  data_classification: string | null;
  pii_data: boolean;
  financial_data: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const ASSET_SELECT =
  'id, category_id, code, name, description, asset_type, status, criticality, criticality_cid, ' +
  'process_type, process_name, sede, asset_id_custom, trd_serie, ' +
  'info_generation_date, entry_date, exit_date, language, format, ' +
  'support, consultation_place, ' +
  'info_owner, info_custodian, update_frequency, ' +
  'icc_social_impact, icc_economic_impact, icc_environmental_impact, icc_is_critical, ' +
  'confidentiality, integrity, availability, ' +
  'confidentiality_value, integrity_value, availability_value, total_value, ' +
  'exception_objective, constitutional_basis, legal_exception_basis, exception_scope, classification_date, classification_term, ' +
  'contains_personal_data, contains_minors_data, personal_data_type, personal_data_purpose, has_data_authorization, ' +
  'department, location, ip_address, hostname, ' +
  'val_confidentiality, val_integrity, val_availability, val_authenticity, val_traceability, ' +
  'is_critical, data_classification, pii_data, financial_data, tags, created_at, updated_at';

export async function getAssets(
  orgId: string,
  params: PaginationParams = {},
  filters?: { asset_type?: string; status?: string; criticality?: string; category_id?: string }
): Promise<PaginatedResult<AssetRow>> {
  return paginatedQuery<AssetRow>('assets', orgId, params, ASSET_SELECT, filters);
}

export async function getAssetsByProcess(
  orgId: string,
  categoryId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<AssetRow>> {
  return paginatedQuery<AssetRow>('assets', orgId, params, ASSET_SELECT, { category_id: categoryId });
}

export async function getAssetById(id: string): Promise<AssetRow | null> {
  return getById<AssetRow>('assets', id);
}

export async function getAssetCount(orgId: string): Promise<number> {
  return countRecords('assets', orgId);
}

export async function getAssetCountByType(orgId: string): Promise<Record<string, number>> {
  const types = ['hardware', 'software', 'network', 'data', 'personnel', 'facility', 'service', 'cloud_resource'];
  const counts: Record<string, number> = {};
  for (const t of types) {
    counts[t] = await countRecords('assets', orgId, { asset_type: t });
  }
  return counts;
}
