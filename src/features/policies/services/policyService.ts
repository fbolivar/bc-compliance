import { createClient } from '@/lib/supabase/server';

export interface PolicyRow {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description: string | null;
  policy_type: string;
  status: string;
  version: string;
  owner: string | null;
  approved_by: string | null;
  approved_at: string | null;
  effective_date: string | null;
  review_date: string | null;
  content: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

async function getOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();
  return data?.organization_id ?? null;
}

export async function getPolicies(
  page = 1,
  pageSize = 20,
  statusFilter?: string
): Promise<{ data: PolicyRow[]; total: number }> {
  const orgId = await getOrgId();
  if (!orgId) return { data: [], total: 0 };
  const supabase = await createClient();
  let query = supabase
    .from('policies')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('code');
  if (statusFilter) query = query.eq('status', statusFilter);
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);
  const { data, count } = await query;
  return { data: data ?? [], total: count ?? 0 };
}

export async function getPolicyById(id: string): Promise<PolicyRow | null> {
  const orgId = await getOrgId();
  if (!orgId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('policies')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();
  return data ?? null;
}

export async function getPoliciesCount(): Promise<number> {
  const orgId = await getOrgId();
  if (!orgId) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  return count ?? 0;
}
