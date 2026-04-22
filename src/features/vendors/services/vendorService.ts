import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface VendorRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  country: string | null;
  tax_id: string | null;
  vendor_type: string | null;
  status: string;
  risk_level: string | null;
  handles_pii: boolean | null;
  handles_financial_data: boolean | null;
  data_location: string | null;
  has_dpa: boolean | null;
  dpa_signed_at: string | null;
  has_iso27001: boolean | null;
  has_soc2: boolean | null;
  has_pentest: boolean | null;
  last_assessment_date: string | null;
  next_assessment_date: string | null;
  risk_score: number | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_value: number | null;
  sla_document_id: string | null;
  notes: string | null;
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

export interface VendorAssessmentRow {
  id: string;
  vendor_id: string;
  assessment_date: string;
  assessor_id: string | null;
  overall_score: number | null;
  risk_level: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  next_assessment_date: string | null;
  notes: string | null;
  created_at: string;
}

export async function getAssessmentsForVendor(vendorId: string): Promise<VendorAssessmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vendor_assessments')
    .select('id, vendor_id, assessment_date, assessor_id, overall_score, risk_level, status, approved_by, approved_at, next_assessment_date, notes, created_at')
    .eq('vendor_id', vendorId)
    .order('assessment_date', { ascending: false });

  if (error) return [];
  return (data ?? []) as VendorAssessmentRow[];
}
