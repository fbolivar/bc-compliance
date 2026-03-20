import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
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
