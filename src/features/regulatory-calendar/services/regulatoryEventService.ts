import { createClient } from '@/lib/supabase/server';

export interface RegulatoryEventRow {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  authority: string;
  event_type: string;
  due_date: string;
  recurrence: string;
  status: string;
  framework_ref: string | null;
  notes: string | null;
  created_at: string;
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

export async function getRegulatoryEvents(): Promise<RegulatoryEventRow[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('regulatory_events')
    .select('*')
    .eq('organization_id', orgId)
    .order('due_date');
  return data ?? [];
}

export async function getRegulatoryEventById(id: string): Promise<RegulatoryEventRow | null> {
  const orgId = await getOrgId();
  if (!orgId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('regulatory_events')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();
  return data ?? null;
}
