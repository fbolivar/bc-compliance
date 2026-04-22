import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface ControlRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  control_type: string;
  category: string | null;
  status: string;
  implementation_level: string | null;
  effectiveness: string | null;
  owner: string | null;
  frequency: string | null;
  last_review_date: string | null;
  next_review_date: string | null;
  evidence_required: boolean;
  automation_level: string | null;
  created_at: string;
  updated_at: string;
}

export async function getControls(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<ControlRow>> {
  return paginatedQuery<ControlRow>('controls', orgId, params, '*', filters);
}

export async function getControlById(id: string): Promise<ControlRow | null> {
  return getById<ControlRow>('controls', id);
}

export async function getControlCount(orgId: string): Promise<number> {
  return countRecords('controls', orgId);
}

export async function getImplementedControlCount(orgId: string): Promise<number> {
  return countRecords('controls', orgId, { status: 'implemented' });
}

export interface MitigatedRisk {
  mapping_id: string;
  risk_id: string;
  code: string;
  name: string;
  risk_level_residual: string;
  risk_residual: number;
  treatment: string;
  effectiveness: number;
}

export interface AvailableRiskOption {
  id: string;
  code: string;
  name: string;
  risk_level_residual: string;
}

export async function getAvailableRisksForControl(
  orgId: string,
  controlId: string,
): Promise<AvailableRiskOption[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('control_risk_mappings')
    .select('risk_scenario_id')
    .eq('control_id', controlId);

  const excludedIds = (existing ?? []).map((r) => r.risk_scenario_id);

  let query = supabase
    .from('risk_scenarios')
    .select('id, code, name, risk_level_residual')
    .eq('organization_id', orgId)
    .order('code');

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AvailableRiskOption[];
}

export interface AvailableRequirementOption {
  id: string;
  code: string;
  title: string;
  framework_code: string;
  framework_name: string;
}

export async function getAvailableRequirementsForControl(
  controlId: string,
): Promise<AvailableRequirementOption[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('control_requirement_mappings')
    .select('requirement_id')
    .eq('control_id', controlId);

  const excludedIds = (existing ?? []).map((r) => r.requirement_id);

  let query = supabase
    .from('framework_requirements')
    .select('id, code, name, frameworks(code, name)')
    .order('code')
    .limit(1000);

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  type Row = {
    id: string;
    code: string;
    name: string;
    frameworks: { code: string; name: string } | null;
  };

  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    code: row.code,
    title: row.name,
    framework_code: row.frameworks?.code ?? '',
    framework_name: row.frameworks?.name ?? '',
  }));
}

export async function getRisksForControl(controlId: string): Promise<MitigatedRisk[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('control_risk_mappings')
    .select(`
      id,
      effectiveness,
      risk_scenarios(id, code, name, risk_level_residual, risk_residual, treatment)
    `)
    .eq('control_id', controlId)
    .order('effectiveness', { ascending: false });

  if (error || !data) return [];

  type Row = {
    id: string;
    effectiveness: number;
    risk_scenarios: {
      id: string;
      code: string;
      name: string;
      risk_level_residual: string;
      risk_residual: number;
      treatment: string;
    } | null;
  };

  return (data as unknown as Row[])
    .filter((row) => row.risk_scenarios)
    .map((row) => ({
      mapping_id: row.id,
      risk_id: row.risk_scenarios!.id,
      code: row.risk_scenarios!.code,
      name: row.risk_scenarios!.name,
      risk_level_residual: row.risk_scenarios!.risk_level_residual,
      risk_residual: row.risk_scenarios!.risk_residual,
      treatment: row.risk_scenarios!.treatment,
      effectiveness: row.effectiveness,
    }));
}

export interface CoveredRequirement {
  mapping_id: string;
  requirement_id: string;
  code: string;
  title: string;
  framework_code: string;
  framework_name: string;
  coverage_percentage: number;
  compliance_status: string;
}

export async function getRequirementsForControl(controlId: string): Promise<CoveredRequirement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('control_requirement_mappings')
    .select(`
      id,
      coverage_percentage,
      compliance_status,
      framework_requirements(
        id,
        code,
        name,
        frameworks(code, name)
      )
    `)
    .eq('control_id', controlId)
    .order('coverage_percentage', { ascending: false });

  if (error || !data) return [];

  type Row = {
    id: string;
    coverage_percentage: number;
    compliance_status: string;
    framework_requirements: {
      id: string;
      code: string;
      name: string;
      frameworks: { code: string; name: string } | null;
    } | null;
  };

  return (data as unknown as Row[])
    .filter((row) => row.framework_requirements)
    .map((row) => ({
      mapping_id: row.id,
      requirement_id: row.framework_requirements!.id,
      code: row.framework_requirements!.code,
      title: row.framework_requirements!.name,
      framework_code: row.framework_requirements!.frameworks?.code ?? '',
      framework_name: row.framework_requirements!.frameworks?.name ?? '',
      coverage_percentage: row.coverage_percentage,
      compliance_status: row.compliance_status,
    }));
}
