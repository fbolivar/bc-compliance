import { createClient } from '@/lib/supabase/server';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';
import type { AssetRow } from './assetService';

export interface ProcessDependency {
  id: string;
  organization_id: string;
  process_id: string;
  name: string;
  kind: string;
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  asset_count: number;
}

export interface DependencyWithProcess extends ProcessDependency {
  process_name: string;
  family_id: string | null;
  family_name: string | null;
  family_icon: string | null;
}

const ASSET_SELECT =
  'id, category_id, code, name, description, asset_type, status, criticality, process_type, process_name, sede, criticality_cid, info_owner, confidentiality, integrity, availability, department, location, ip_address, hostname, val_confidentiality, val_integrity, val_availability, val_authenticity, val_traceability, is_critical, data_classification, pii_data, financial_data, tags, created_at, updated_at';

/**
 * Returns the list of dependencies for a given process, with a live count
 * of assets linked through the pivot.
 */
export async function getDependenciesByProcess(
  processId: string,
  orgId: string,
): Promise<ProcessDependency[]> {
  const supabase = await createClient();

  const { data: deps } = await supabase
    .from('process_dependencies')
    .select('id, organization_id, process_id, name, kind, description, sort_order, created_at, updated_at')
    .eq('organization_id', orgId)
    .eq('process_id', processId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const list = (deps ?? []) as Omit<ProcessDependency, 'asset_count'>[];
  if (list.length === 0) return [];

  // Count assets per dependency
  const depIds = list.map((d) => d.id);
  const { data: pivots } = await supabase
    .from('dependency_assets')
    .select('dependency_id')
    .in('dependency_id', depIds);

  const counts = new Map<string, number>();
  for (const row of (pivots ?? []) as Array<{ dependency_id: string }>) {
    counts.set(row.dependency_id, (counts.get(row.dependency_id) ?? 0) + 1);
  }

  return list.map((d) => ({ ...d, asset_count: counts.get(d.id) ?? 0 }));
}

/**
 * Fetches a single dependency with its parent process + family info.
 */
export async function getDependencyById(
  id: string,
  orgId: string,
): Promise<DependencyWithProcess | null> {
  const supabase = await createClient();

  const { data: dep } = await supabase
    .from('process_dependencies')
    .select('id, organization_id, process_id, name, kind, description, sort_order, created_at, updated_at')
    .eq('organization_id', orgId)
    .eq('id', id)
    .single();

  if (!dep) return null;

  // Fetch the process (asset_categories child) + family root
  const { data: process } = await supabase
    .from('asset_categories')
    .select('id, name, parent_id')
    .eq('organization_id', orgId)
    .eq('id', dep.process_id)
    .single();

  let familyId: string | null = null;
  let familyName: string | null = null;
  let familyIcon: string | null = null;

  if (process?.parent_id) {
    const { data: family } = await supabase
      .from('asset_categories')
      .select('id, name, icon')
      .eq('organization_id', orgId)
      .eq('id', process.parent_id)
      .single();
    if (family) {
      familyId = family.id;
      familyName = family.name;
      familyIcon = family.icon;
    }
  }

  // Asset count for this dependency
  const { count } = await supabase
    .from('dependency_assets')
    .select('asset_id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('dependency_id', id);

  return {
    ...(dep as Omit<ProcessDependency, 'asset_count'>),
    asset_count: count ?? 0,
    process_name: process?.name ?? 'Proceso',
    family_id: familyId,
    family_name: familyName,
    family_icon: familyIcon,
  };
}

/**
 * Returns the assets linked to a dependency via the pivot table.
 * Paginated. Supports search via params.search (matches asset name).
 */
export async function getAssetsByDependency(
  dependencyId: string,
  orgId: string,
  params: PaginationParams = {},
): Promise<PaginatedResult<AssetRow>> {
  const supabase = await createClient();

  // First, get the asset_ids for this dependency
  const { data: pivots } = await supabase
    .from('dependency_assets')
    .select('asset_id')
    .eq('organization_id', orgId)
    .eq('dependency_id', dependencyId);

  const assetIds = (pivots ?? []).map((p) => (p as { asset_id: string }).asset_id);

  if (assetIds.length === 0) {
    return {
      data: [],
      count: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 25,
      totalPages: 0,
    };
  }

  // Use paginatedQuery with an `id IN (...)` filter via custom query
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('assets')
    .select(ASSET_SELECT, { count: 'exact' })
    .eq('organization_id', orgId)
    .in('id', assetIds);

  if (params.search) query = query.ilike('name', `%${params.search}%`);
  if (params.sortBy) query = query.order(params.sortBy, { ascending: params.sortOrder !== 'desc' });
  else query = query.order('created_at', { ascending: false });
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(`Query error on assets: ${error.message}`);

  return {
    data: (data || []) as unknown as AssetRow[],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Returns the dependency_ids an asset is currently linked to.
 */
export async function getAssetDependencyIds(
  assetId: string,
  orgId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('dependency_assets')
    .select('dependency_id')
    .eq('organization_id', orgId)
    .eq('asset_id', assetId);
  return (data ?? []).map((row) => (row as { dependency_id: string }).dependency_id);
}

