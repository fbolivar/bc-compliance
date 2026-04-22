import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface NCRow {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description: string | null;
  nc_type: string;
  status: string;
  source: string | null;
  source_ref_id: string | null;
  source_ref_type: string | null;
  raised_by: string | null;
  assigned_to: string | null;
  root_cause: string | null;
  root_cause_method: string | null;
  root_cause_completed_at: string | null;
  detected_at: string | null;
  target_close_date: string | null;
  closed_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  framework_id: string | null;
  requirement_id: string | null;
  control_id: string | null;
  notes: string | null;
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

export interface CapaActionRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  action_type: string;
  status: string;
  responsible_id: string | null;
  due_date: string | null;
  completed_date: string | null;
  is_effective: boolean | null;
  effectiveness_notes: string | null;
  notes: string | null;
  created_at: string;
}

export async function getCapaActionsForNC(ncId: string): Promise<CapaActionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('capa_actions')
    .select('id, code, title, description, action_type, status, responsible_id, due_date, completed_date, is_effective, effectiveness_notes, notes, created_at')
    .eq('nonconformity_id', ncId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) return [];
  return (data ?? []) as CapaActionRow[];
}

export interface NCLinkedEntity {
  requirement?: { id: string; code: string; name: string; framework_name: string } | null;
  control?: { id: string; code: string; name: string; status: string } | null;
}

export async function getNCLinkedEntities(nc: NCRow): Promise<NCLinkedEntity> {
  const supabase = await createClient();
  const result: NCLinkedEntity = {};

  if (nc.requirement_id) {
    const { data } = await supabase
      .from('framework_requirements')
      .select('id, code, name, frameworks(name)')
      .eq('id', nc.requirement_id)
      .single();
    if (data) {
      const row = data as unknown as { id: string; code: string; name: string; frameworks: { name: string } | null };
      result.requirement = {
        id: row.id,
        code: row.code,
        name: row.name,
        framework_name: row.frameworks?.name ?? '',
      };
    }
  }

  if (nc.control_id) {
    const { data } = await supabase
      .from('controls')
      .select('id, code, name, status')
      .eq('id', nc.control_id)
      .single();
    if (data) result.control = data as NCLinkedEntity['control'];
  }

  return result;
}
