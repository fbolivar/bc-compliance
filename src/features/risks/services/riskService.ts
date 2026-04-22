import { countRecords } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface RiskRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  asset_id: string;
  threat_id: string;
  degradation_c: number;
  degradation_i: number;
  degradation_a: number;
  degradation_au: number;
  degradation_t: number;
  frequency: number;
  impact_c: number;
  impact_i: number;
  impact_a: number;
  impact_au: number;
  impact_t: number;
  impact_max: number;
  risk_potential: number;
  safeguard_effectiveness: number;
  risk_residual: number;
  risk_level_inherent: string;
  risk_level_residual: string;
  treatment: string;
  treatment_justification: string | null;
  is_active: boolean;
  review_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  assets?: { code: string; name: string; asset_type: string };
  threat_catalog?: { code: string; name: string; origin: string };
}

export async function getRisks(
  orgId: string,
  params: PaginationParams = {},
  filters?: { risk_level_residual?: string; treatment?: string }
): Promise<PaginatedResult<RiskRow>> {
  const supabase = await createClient();
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('risk_scenarios')
    .select('*, assets(code, name, asset_type), threat_catalog(code, name, origin)', { count: 'exact' })
    .eq('organization_id', orgId);

  if (filters?.risk_level_residual) query = query.eq('risk_level_residual', filters.risk_level_residual);
  if (filters?.treatment) query = query.eq('treatment', filters.treatment);
  if (params.search) query = query.ilike('name', `%${params.search}%`);

  query = query.order('risk_residual', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data || []) as RiskRow[],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getRiskById(id: string): Promise<RiskRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('risk_scenarios')
    .select('*, assets(code, name, asset_type), threat_catalog(code, name, origin)')
    .eq('id', id)
    .single();
  return data as RiskRow | null;
}

export interface MitigatingControl {
  mapping_id: string;
  control_id: string;
  code: string;
  name: string;
  status: string;
  effectiveness_rating: string | null;
  effectiveness: number;
  notes: string | null;
}

export interface AvailableControlOption {
  id: string;
  code: string;
  name: string;
  status: string;
}

export async function getAvailableControlsForRisk(
  orgId: string,
  riskId: string,
): Promise<AvailableControlOption[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('control_risk_mappings')
    .select('control_id')
    .eq('risk_scenario_id', riskId);

  const excludedIds = (existing ?? []).map((r) => r.control_id);

  let query = supabase
    .from('controls')
    .select('id, code, name, status')
    .eq('organization_id', orgId)
    .order('code');

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AvailableControlOption[];
}

export async function getMitigatingControlsForRisk(riskId: string): Promise<MitigatingControl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('control_risk_mappings')
    .select(`
      id,
      effectiveness,
      notes,
      controls(id, code, name, status, effectiveness)
    `)
    .eq('risk_scenario_id', riskId)
    .order('effectiveness', { ascending: false });

  if (error || !data) return [];

  type Row = {
    id: string;
    effectiveness: number;
    notes: string | null;
    controls: { id: string; code: string; name: string; status: string; effectiveness: string | null } | null;
  };

  return (data as unknown as Row[])
    .filter((row) => row.controls)
    .map((row) => ({
      mapping_id: row.id,
      control_id: row.controls!.id,
      code: row.controls!.code,
      name: row.controls!.name,
      status: row.controls!.status,
      effectiveness_rating: row.controls!.effectiveness,
      effectiveness: row.effectiveness,
      notes: row.notes,
    }));
}

export async function getRiskCount(orgId: string): Promise<number> {
  return countRecords('risk_scenarios', orgId);
}

export async function getRiskDistribution(orgId: string): Promise<Record<string, number>> {
  const levels = ['critical', 'high', 'medium', 'low', 'negligible'];
  const dist: Record<string, number> = {};
  for (const level of levels) {
    dist[level] = await countRecords('risk_scenarios', orgId, { risk_level_residual: level });
  }
  return dist;
}
