import { paginatedQuery, getById, countRecords } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface AutomationRuleRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_conditions: Record<string, unknown> | null;
  action_type: string;
  action_config: Record<string, unknown> | null;
  status: string;
  priority: number;
  cooldown_minutes: number;
  last_triggered_at: string | null;
  execution_count: number;
  error_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAutomationRules(
  orgId: string,
  params: PaginationParams = {},
  filters?: Record<string, string | undefined>
): Promise<PaginatedResult<AutomationRuleRow>> {
  return paginatedQuery<AutomationRuleRow>('automation_rules', orgId, params, '*', filters);
}

export async function getAutomationRuleById(id: string): Promise<AutomationRuleRow | null> {
  return getById<AutomationRuleRow>('automation_rules', id);
}

export async function getAutomationRuleCount(orgId: string): Promise<number> {
  return countRecords('automation_rules', orgId);
}

export async function getActiveRuleCount(orgId: string): Promise<number> {
  return countRecords('automation_rules', orgId, { status: 'active' });
}
