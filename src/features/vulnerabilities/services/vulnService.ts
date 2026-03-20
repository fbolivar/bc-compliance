import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface VulnRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  severity: string;
  status: string;
  cvss_score: number | null;
  cve_id: string | null;
  affected_asset_id: string | null;
  discovery_date: string | null;
  due_date: string | null;
  remediation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getVulnerabilities(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<VulnRow>> {
  return paginatedQuery<VulnRow>('vulnerabilities', orgId, params, '*', filters);
}

export async function getVulnerabilityById(id: string): Promise<VulnRow | null> {
  return getById<VulnRow>('vulnerabilities', id);
}

export async function getVulnerabilityCount(orgId: string): Promise<number> {
  return countRecords('vulnerabilities', orgId);
}

export async function getOpenVulnCount(orgId: string): Promise<number> {
  return countRecords('vulnerabilities', orgId, { status: 'open' });
}
