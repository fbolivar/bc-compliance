import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface VendorRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  risk_level: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  country: string | null;
  contract_start: string | null;
  contract_end: string | null;
  sla_terms: string | null;
  data_processing: boolean;
  last_assessment_date: string | null;
  next_assessment_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function getVendors(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<VendorRow>> {
  return paginatedQuery<VendorRow>('vendors', orgId, params, '*', filters);
}

export async function getVendorById(id: string): Promise<VendorRow | null> {
  return getById<VendorRow>('vendors', id);
}

export async function getVendorCount(orgId: string): Promise<number> {
  return countRecords('vendors', orgId);
}
