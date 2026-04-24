import { createClient } from '@/lib/supabase/server';

export interface FrameworkRow {
  id: string;
  code: string;
  name: string;
  version: string | null;
  description: string | null;
  is_active: boolean;
  total_requirements: number;
  compliant_count: number;
  partial_count: number;
  non_compliant_count: number;
  compliance_percentage: number;
}

export interface RequirementRow {
  id: string;
  framework_id: string;
  code: string;
  title: string;
  description: string | null;
  section: string | null;
  is_mandatory: boolean;
  compliance_status: string;
  notes: string | null;
}

export interface SoaEntryRow {
  id: string;
  organization_id: string;
  requirement_id: string;
  control_id: string | null;
  applicability: string;
  justification: string | null;
  implementation_status: string;
  created_at: string;
  updated_at: string;
}

export async function getFrameworksWithCompliance(orgId: string): Promise<FrameworkRow[]> {
  const supabase = await createClient();

  // Get all frameworks
  const { data: frameworks, error: fwError } = await supabase
    .from('frameworks')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (fwError || !frameworks) return [];

  // For each framework, compute compliance from soa_entries joined with requirements
  const result: FrameworkRow[] = await Promise.all(
    frameworks.map(async (fw) => {
      const { data: requirements } = await supabase
        .from('framework_requirements')
        .select('id')
        .eq('framework_id', fw.id);

      const reqIds = (requirements || []).map((r) => r.id);
      const total = reqIds.length;

      if (total === 0) {
        return {
          ...fw,
          total_requirements: 0,
          compliant_count: 0,
          partial_count: 0,
          non_compliant_count: 0,
          compliance_percentage: 0,
        };
      }

      const { data: soaEntries } = await supabase
        .from('soa_entries')
        .select('requirement_id, implementation_status, compliance_status')
        .eq('organization_id', orgId)
        .in('requirement_id', reqIds);

      const entries = soaEntries || [];
      const compliant = entries.filter((e) => e.implementation_status === 'implemented').length;
      const partial = entries.filter((e) => e.implementation_status === 'partially_implemented').length;
      // Only count explicitly marked non-compliant; 'not_assessed' rows are "sin evaluar"
      const nonCompliant = entries.filter(
        (e) => e.implementation_status === 'not_implemented' && e.compliance_status !== 'not_assessed',
      ).length;

      const percentage = total > 0 ? Math.round(((compliant + partial * 0.5) / total) * 100) : 0;

      return {
        ...fw,
        total_requirements: total,
        compliant_count: compliant,
        partial_count: partial,
        non_compliant_count: nonCompliant,
        compliance_percentage: percentage,
      };
    })
  );

  return result;
}

export async function getFrameworkById(id: string): Promise<FrameworkRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('frameworks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as FrameworkRow;
}

export async function getFrameworkRequirements(frameworkId: string): Promise<RequirementRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('framework_requirements')
    .select('*')
    .eq('framework_id', frameworkId)
    .order('code');

  if (error) return [];
  // DB column is `name`; interface uses `title` — alias for backward compat
  return (data ?? []).map((r) => ({
    ...r,
    title: (r as { name?: string; title?: string }).name ?? (r as { title?: string }).title ?? '',
  })) as RequirementRow[];
}

export async function getSoaEntries(orgId: string): Promise<SoaEntryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('soa_entries')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []) as SoaEntryRow[];
}

export interface GapAnalysisItem {
  framework_name: string;
  requirement_code: string;
  requirement_title: string;
  compliance_status: string;
  gap_description: string | null;
}

export interface RequirementControlMapping {
  requirement_id: string;
  control_id: string;
  control_code: string;
  control_name: string;
  control_status: string;
  coverage_percentage: number;
  compliance_status: string;
}

export async function getControlMappingsByRequirements(
  requirementIds: string[],
): Promise<RequirementControlMapping[]> {
  if (requirementIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('control_requirement_mappings')
    .select(`
      requirement_id,
      coverage_percentage,
      compliance_status,
      controls(id, code, name, status)
    `)
    .in('requirement_id', requirementIds);

  if (error || !data) return [];

  type Row = {
    requirement_id: string;
    coverage_percentage: number;
    compliance_status: string;
    controls: { id: string; code: string; name: string; status: string } | null;
  };

  return (data as unknown as Row[])
    .filter((row) => row.controls)
    .map((row) => ({
      requirement_id: row.requirement_id,
      control_id: row.controls!.id,
      control_code: row.controls!.code,
      control_name: row.controls!.name,
      control_status: row.controls!.status,
      coverage_percentage: row.coverage_percentage,
      compliance_status: row.compliance_status,
    }));
}

export async function getGapAnalysis(orgId: string): Promise<GapAnalysisItem[]> {
  const supabase = await createClient();

  const { data: frameworks } = await supabase
    .from('frameworks')
    .select('id, name')
    .eq('is_active', true);

  if (!frameworks) return [];

  const gaps: GapAnalysisItem[] = [];

  for (const fw of frameworks) {
    const { data: requirements } = await supabase
      .from('framework_requirements')
      .select('id, code, name')
      .eq('framework_id', fw.id);

    if (!requirements) continue;

    const reqIds = requirements.map((r) => r.id);

    const { data: soaEntries } = await supabase
      .from('soa_entries')
      .select('requirement_id, implementation_status, justification')
      .eq('organization_id', orgId)
      .in('requirement_id', reqIds);

    const entriesMap = new Map((soaEntries || []).map((e) => [e.requirement_id, e]));

    for (const req of requirements) {
      const entry = entriesMap.get(req.id);
      const status = entry?.implementation_status || 'not_assessed';

      if (status !== 'implemented') {
        gaps.push({
          framework_name: fw.name,
          requirement_code: req.code,
          requirement_title: req.name,
          compliance_status: status,
          gap_description: entry?.justification || null,
        });
      }
    }
  }

  return gaps;
}
