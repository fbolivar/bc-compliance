import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface AssetRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  asset_type: string;
  status: string;
  criticality: string;
  criticality_cid: string | null;
  process_type: string | null;
  process_name: string | null;
  sede: string | null;
  info_owner: string | null;
  confidentiality: string | null;
  integrity: string | null;
  availability: string | null;
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
  'id, code, name, description, asset_type, status, criticality, process_type, process_name, sede, criticality_cid, info_owner, confidentiality, integrity, availability, department, location, ip_address, hostname, val_confidentiality, val_integrity, val_availability, val_authenticity, val_traceability, is_critical, data_classification, pii_data, financial_data, tags, created_at, updated_at';

export async function getAssets(
  orgId: string,
  params: PaginationParams = {},
  filters?: { asset_type?: string; status?: string; criticality?: string }
): Promise<PaginatedResult<AssetRow>> {
  return paginatedQuery<AssetRow>('assets', orgId, params, ASSET_SELECT, filters);
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
