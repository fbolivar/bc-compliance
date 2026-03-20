import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';

export interface AuditRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  audit_type: string;
  scope: string | null;
  status: string;
  lead_auditor: string | null;
  audit_team: string[] | null;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  framework_id: string | null;
  findings_count: number;
  open_findings: number;
  report_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditFindingRow {
  id: string;
  audit_id: string;
  code: string;
  title: string;
  description: string | null;
  finding_type: string;
  severity: string;
  status: string;
  recommendation: string | null;
  due_date: string | null;
  created_at: string;
}

export async function getAudits(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<AuditRow>> {
  return paginatedQuery<AuditRow>('audits', orgId, params, '*', filters);
}

export async function getAuditById(id: string): Promise<AuditRow | null> {
  return getById<AuditRow>('audits', id);
}

export async function getAuditCount(orgId: string): Promise<number> {
  return countRecords('audits', orgId);
}

export async function getAuditFindings(auditId: string): Promise<AuditFindingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_findings')
    .select('*')
    .eq('audit_id', auditId)
    .order('code');

  if (error) return [];
  return (data || []) as AuditFindingRow[];
}
