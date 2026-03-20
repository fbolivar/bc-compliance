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

export async function getAssets(
  orgId: string,
  params: PaginationParams = {},
  filters?: { asset_type?: string; status?: string; criticality?: string }
): Promise<PaginatedResult<AssetRow>> {
  return paginatedQuery<AssetRow>('assets', orgId, params, '*', filters);
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
