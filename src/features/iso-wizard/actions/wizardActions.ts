'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/shared/lib/actions-helpers';
import { writeAuditLog } from '@/shared/lib/audit';
import type { ActionResult } from '@/shared/lib/actions-helpers';

function revalidateWizard(phaseNumber?: number) {
  revalidatePath('/iso-wizard');
  if (phaseNumber) revalidatePath(`/iso-wizard/${phaseNumber}`);
}

export async function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable',
  phaseNumber: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: 'No autenticado' };

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.completed_by = user.id;
  } else {
    updates.completed_at = null;
    updates.completed_by = null;
  }

  const { error } = await supabase.from('iso_wizard_tasks').update(updates).eq('id', taskId);
  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'iso_wizard_tasks',
    recordId: taskId,
    description: `Tarea wizard ISO 27001 actualizada: ${status}`,
  });

  revalidateWizard(phaseNumber);
  return { success: true };
}

export async function updateTaskNotes(
  taskId: string,
  notes: string,
  evidenceUrl: string | null,
  phaseNumber: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('iso_wizard_tasks')
    .update({ notes: notes || null, evidence_url: evidenceUrl || null, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) return { error: error.message };
  revalidateWizard(phaseNumber);
  return { success: true };
}

export async function updatePhaseNotes(
  phaseId: string,
  notes: string,
  phaseNumber: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('iso_wizard_phases')
    .update({ notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', phaseId);

  if (error) return { error: error.message };
  revalidateWizard(phaseNumber);
  return { success: true };
}
