import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';

export interface DocumentRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  document_type: string;
  category: string | null;
  status: string;
  version: string | null;
  author: string | null;
  owner: string | null;
  review_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  evidence_type: string;
  status: string;
  reference_id: string | null;
  reference_type: string | null;
  file_url: string | null;
  collected_date: string | null;
  collected_by: string | null;
  created_at: string;
}

export async function getDocuments(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<DocumentRow>> {
  return paginatedQuery<DocumentRow>('documents', orgId, params, '*', filters);
}

export async function getDocumentById(id: string): Promise<DocumentRow | null> {
  return getById<DocumentRow>('documents', id);
}

export async function getDocumentCount(orgId: string): Promise<number> {
  return countRecords('documents', orgId);
}

export async function getEvidence(
  orgId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<EvidenceRow>> {
  return paginatedQuery<EvidenceRow>('evidence', orgId, params);
}

export async function getEvidenceCount(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('evidence')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  return count || 0;
}
