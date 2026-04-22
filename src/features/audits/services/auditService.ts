import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';

export interface AuditRow {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description: string | null;
  year: number | null;
  audit_type: string;
  status: string;
  framework_id: string | null;
  scope_description: string | null;
  departments: string[] | null;
  lead_auditor_id: string | null;
  auditor_ids: string[] | null;
  auditee_id: string | null;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  certification_body: string | null;
  certificate_number: string | null;
  certificate_expiry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditFindingRow {
  id: string;
  audit_id: string;
  code: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  clause_reference: string | null;
  finding_details: string | null;
  auditor_recommendation: string | null;
  management_response: string | null;
  response_due_date: string | null;
  requirement_id: string | null;
  control_id: string | null;
  nonconformity_id: string | null;
  closed_at: string | null;
  closure_evidence: string | null;
  created_at: string;
}

export async function getAudits(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>,
): Promise<PaginatedResult<AuditRow>> {
  return paginatedQuery<AuditRow>('audit_programs', orgId, params, '*', filters);
}

export async function getAuditById(id: string): Promise<AuditRow | null> {
  return getById<AuditRow>('audit_programs', id);
}

export async function getAuditCount(orgId: string): Promise<number> {
  return countRecords('audit_programs', orgId);
}

export async function getAuditFindings(auditId: string): Promise<AuditFindingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_findings')
    .select('*')
    .eq('audit_id', auditId)
    .order('code');

  if (error) return [];
  return (data ?? []) as AuditFindingRow[];
}

export interface EnrichedAuditFinding extends AuditFindingRow {
  requirement_code: string | null;
  requirement_name: string | null;
  requirement_framework: string | null;
  control_code: string | null;
  control_name: string | null;
  nonconformity_code: string | null;
}

export async function getEnrichedAuditFindings(auditId: string): Promise<EnrichedAuditFinding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_findings')
    .select(`
      *,
      framework_requirements(code, name, frameworks(name)),
      controls(code, name),
      nonconformities(code)
    `)
    .eq('audit_id', auditId)
    .order('code');

  if (error || !data) return [];

  type Raw = AuditFindingRow & {
    framework_requirements: { code: string; name: string; frameworks: { name: string } | null } | null;
    controls: { code: string; name: string } | null;
    nonconformities: { code: string } | null;
  };

  return (data as unknown as Raw[]).map((f) => ({
    ...f,
    requirement_code: f.framework_requirements?.code ?? null,
    requirement_name: f.framework_requirements?.name ?? null,
    requirement_framework: f.framework_requirements?.frameworks?.name ?? null,
    control_code: f.controls?.code ?? null,
    control_name: f.controls?.name ?? null,
    nonconformity_code: f.nonconformities?.code ?? null,
  }));
}
