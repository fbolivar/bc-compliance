import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface NCRow {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  severity: string;
  status: string;
  source: string | null;
  detected_date: string | null;
  due_date: string | null;
  closure_date: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getNonConformities(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<NCRow>> {
  return paginatedQuery<NCRow>('nonconformities', orgId, params, '*', filters);
}

export async function getNCById(id: string): Promise<NCRow | null> {
  return getById<NCRow>('nonconformities', id);
}

export async function getNCCount(orgId: string): Promise<number> {
  return countRecords('nonconformities', orgId);
}
