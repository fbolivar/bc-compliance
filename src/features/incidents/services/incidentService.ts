import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';
import { createClient } from '@/lib/supabase/server';

export interface IncidentRow {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  category: string | null;
  detection_date: string | null;
  containment_date: string | null;
  resolution_date: string | null;
  affected_assets: string[];
  impact_description: string | null;
  root_cause: string | null;
  lessons_learned: string | null;
  reporter_id: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentTimelineRow {
  id: string;
  incident_id: string;
  event_type: string;
  description: string;
  occurred_at: string;
  recorded_by: string | null;
}

export async function getIncidents(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<IncidentRow>> {
  return paginatedQuery<IncidentRow>('incidents', orgId, params, '*', filters);
}

export async function getIncidentById(id: string): Promise<IncidentRow | null> {
  return getById<IncidentRow>('incidents', id);
}

export async function getIncidentCount(orgId: string): Promise<number> {
  return countRecords('incidents', orgId);
}

export async function getActiveIncidentCount(orgId: string): Promise<number> {
  return countRecords('incidents', orgId, { status: 'detected' });
}

export async function getIncidentTimeline(incidentId: string): Promise<IncidentTimelineRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('incident_timeline')
    .select('*')
    .eq('incident_id', incidentId)
    .order('occurred_at', { ascending: true });

  if (error) return [];
  return (data || []) as IncidentTimelineRow[];
}
