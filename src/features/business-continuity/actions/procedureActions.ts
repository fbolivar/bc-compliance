'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserOrgId, type ActionResult } from '@/shared/lib/actions-helpers';

export async function createProcedure(planId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const stepNumberRaw = formData.get('step_number');
  const estimatedHoursRaw = formData.get('estimated_hours');

  const record = {
    bcp_plan_id: planId,
    organization_id: orgId,
    phase: formData.get('phase') as string,
    step_number: stepNumberRaw !== null && stepNumberRaw !== '' ? Number(stepNumberRaw) : null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string | null) || null,
    responsible: (formData.get('responsible') as string | null) || null,
    estimated_hours: estimatedHoursRaw !== null && estimatedHoursRaw !== '' ? Number(estimatedHoursRaw) : null,
  };

  const { data, error } = await supabase
    .from('bcp_procedures')
    .insert(record)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/business-continuity/${planId}`);
  return { success: true, data: data as Record<string, unknown> };
}

export async function deleteProcedure(id: string, planId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const { error } = await supabase
    .from('bcp_procedures')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) return { error: error.message };

  revalidatePath(`/business-continuity/${planId}`);
  return { success: true };
}
