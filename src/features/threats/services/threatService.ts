import { createClient } from '@/lib/supabase/server';

export interface ThreatRow {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  origin: string;
  category: string | null;
  affected_dimensions: string[];
  is_system: boolean;
  created_at: string;
}

export async function getThreats(orgId: string): Promise<ThreatRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('threat_catalog')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .order('code');

  if (error) throw new Error(`Query error on threat_catalog: ${error.message}`);
  return (data || []) as ThreatRow[];
}

export async function getThreatsByOrigin(orgId: string): Promise<Record<string, ThreatRow[]>> {
  const threats = await getThreats(orgId);
  return threats.reduce<Record<string, ThreatRow[]>>((acc, threat) => {
    const origin = threat.origin || 'other';
    if (!acc[origin]) acc[origin] = [];
    acc[origin].push(threat);
    return acc;
  }, {});
}

export async function getThreatById(id: string): Promise<ThreatRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();
  if (!member) return null;
  const { data } = await supabase
    .from('threat_catalog')
    .select('*')
    .eq('id', id)
    .or(`organization_id.eq.${member.organization_id},is_system.eq.true`)
    .single();
  return data ?? null;
}

export interface LinkedRisk {
  id: string;
  code: string;
  name: string;
  risk_zone: string | null;
  probability_label: string | null;
  impact_label: string | null;
  treatment: string | null;
}

export async function getLinkedRisksForThreat(threatId: string): Promise<LinkedRisk[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();
  if (!member) return [];
  const { data } = await supabase
    .from('risk_scenarios')
    .select('id, code, name, risk_zone, probability_label, impact_label, treatment')
    .eq('organization_id', member.organization_id)
    .eq('threat_id', threatId)
    .order('code');
  return (data ?? []) as LinkedRisk[];
}

export interface LinkedControl {
  id: string;
  code: string;
  name: string;
  status: string;
  control_type: string;
  overall_effectiveness: number | null;
}

export async function getLinkedControlsForThreat(threatId: string): Promise<LinkedControl[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();
  if (!member) return [];

  // Step 1: Get risk IDs linked to this threat
  const { data: risks } = await supabase
    .from('risk_scenarios')
    .select('id')
    .eq('organization_id', member.organization_id)
    .eq('threat_id', threatId);
  const riskIds = (risks ?? []).map((r) => r.id);
  if (riskIds.length === 0) return [];

  // Step 2: Get control IDs from control_risk_mappings
  const { data: mappings } = await supabase
    .from('control_risk_mappings')
    .select('control_id')
    .in('risk_id', riskIds);
  const controlIds = [...new Set((mappings ?? []).map((m) => m.control_id))];
  if (controlIds.length === 0) return [];

  // Step 3: Fetch the controls
  const { data } = await supabase
    .from('controls')
    .select('id, code, name, status, control_type, overall_effectiveness')
    .eq('organization_id', member.organization_id)
    .in('id', controlIds)
    .order('code');
  return (data ?? []) as LinkedControl[];
}
