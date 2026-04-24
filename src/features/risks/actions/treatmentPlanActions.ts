'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';

type ActionResult = { ok: true } | { ok: false; error: string };

const PLAN_STATUSES = ['draft', 'approved', 'in_progress', 'completed', 'cancelled'] as const;
const ACTION_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;

export async function updatePlanStatus(planId: string, status: string): Promise<ActionResult> {
  if (!PLAN_STATUSES.includes(status as typeof PLAN_STATUSES[number])) {
    return { ok: false, error: 'Estado inválido' };
  }
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { ok: false, error: 'Sin organización' };

  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  if (status === 'completed') update.completed_date = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('treatment_plans')
    .update(update)
    .eq('id', planId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/risks/treatment-plans');
  revalidatePath(`/risks/treatment-plans/${planId}`);
  return { ok: true };
}

export async function updateActionStatus(actionId: string, status: string): Promise<ActionResult> {
  if (!ACTION_STATUSES.includes(status as typeof ACTION_STATUSES[number])) {
    return { ok: false, error: 'Estado inválido' };
  }
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { ok: false, error: 'Sin organización' };

  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  if (status === 'completed') update.completed_date = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('treatment_plan_actions')
    .update(update)
    .eq('id', actionId)
    .eq('organization_id', orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/risks/treatment-plans');
  return { ok: true };
}
