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
