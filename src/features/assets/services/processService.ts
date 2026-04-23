import { createClient } from '@/lib/supabase/server';

export interface ProcessCategory {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number | null;
  parent_id: string;
  family_id: string;
  family_name: string;
  family_icon: string | null;
  family_sort_order: number | null;
  asset_count: number;
}

export interface ProcessFamily {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number | null;
  processes: ProcessCategory[];
  total_assets: number;
}

/**
 * Returns the 5 process families (root categories) with their child processes,
 * each enriched with a live count of assets assigned to them via assets.category_id.
 */
export async function getProcessesGroupedByFamily(orgId: string): Promise<ProcessFamily[]> {
  const supabase = await createClient();

  // Fetch all categories for the org (roots + children)
  const { data: categories } = await supabase
    .from('asset_categories')
    .select('id, name, parent_id, icon, sort_order')
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  type CatRow = {
    id: string;
    name: string;
    parent_id: string | null;
    icon: string | null;
    sort_order: number | null;
  };
  const cats = (categories ?? []) as CatRow[];

  const roots = cats.filter((c) => c.parent_id === null);
  const children = cats.filter((c) => c.parent_id !== null);

  // Count assets per category_id (only for active assets)
  const { data: assetRows } = await supabase
    .from('assets')
    .select('category_id')
    .eq('organization_id', orgId)
    .not('category_id', 'is', null);

  const countByCategory = new Map<string, number>();
  for (const row of (assetRows ?? []) as Array<{ category_id: string | null }>) {
    if (!row.category_id) continue;
    countByCategory.set(row.category_id, (countByCategory.get(row.category_id) ?? 0) + 1);
  }

  return roots.map((root) => {
    const rootChildren = children.filter((c) => c.parent_id === root.id);
    const processes: ProcessCategory[] = rootChildren.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      sort_order: c.sort_order,
      parent_id: root.id,
      family_id: root.id,
      family_name: root.name,
      family_icon: root.icon,
      family_sort_order: root.sort_order,
      asset_count: countByCategory.get(c.id) ?? 0,
    }));
    const totalAssets = processes.reduce((sum, p) => sum + p.asset_count, 0);
    return {
      id: root.id,
      name: root.name,
      icon: root.icon,
      sort_order: root.sort_order,
      processes,
      total_assets: totalAssets,
    };
  });
}

/**
 * Fetches a single process category (child) along with its parent family info.
 * Returns null if the category doesn't exist or is a root (parent_id IS NULL).
 */
export async function getProcessById(
  categoryId: string,
  orgId: string,
): Promise<ProcessCategory | null> {
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from('asset_categories')
    .select('id, name, parent_id, icon, sort_order')
    .eq('organization_id', orgId)
    .eq('id', categoryId)
    .single();

  if (!cat || !cat.parent_id) return null;

  const { data: parent } = await supabase
    .from('asset_categories')
    .select('id, name, icon, sort_order')
    .eq('organization_id', orgId)
    .eq('id', cat.parent_id)
    .single();

  const { count } = await supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('category_id', categoryId);

  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    sort_order: cat.sort_order,
    parent_id: cat.parent_id,
    family_id: parent?.id ?? cat.parent_id,
    family_name: parent?.name ?? 'Familia',
    family_icon: parent?.icon ?? null,
    family_sort_order: parent?.sort_order ?? null,
    asset_count: count ?? 0,
  };
}
