import { createClient } from '@/lib/supabase/server';
import { WIZARD_PHASES } from '../lib/wizard-config';

export interface WizardPhaseRow {
  id: string;
  organization_id: string;
  phase_number: number;
  status: 'pending' | 'in_progress' | 'completed';
  completion_pct: number;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface WizardTaskRow {
  id: string;
  organization_id: string;
  phase_id: string;
  task_key: string;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  notes: string | null;
  evidence_url: string | null;
  linked_document_id: string | null;
  linked_policy_id: string | null;
  linked_risk_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

export interface WizardPhaseWithTasks extends WizardPhaseRow {
  tasks: WizardTaskRow[];
}

export async function ensureWizardInitialized(orgId: string): Promise<void> {
  const supabase = await createClient();

  for (const phaseDef of WIZARD_PHASES) {
    const { data: existing } = await supabase
      .from('iso_wizard_phases')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phase_number', phaseDef.number)
      .maybeSingle();

    let phaseId: string;

    if (existing) {
      phaseId = existing.id;
    } else {
      const { data: inserted } = await supabase
        .from('iso_wizard_phases')
        .insert({ organization_id: orgId, phase_number: phaseDef.number })
        .select('id')
        .single();
      if (!inserted) continue;
      phaseId = inserted.id;
    }

    for (const task of phaseDef.tasks) {
      const { data: existingTask } = await supabase
        .from('iso_wizard_tasks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('task_key', task.key)
        .maybeSingle();

      if (!existingTask) {
        await supabase.from('iso_wizard_tasks').insert({
          organization_id: orgId,
          phase_id: phaseId,
          task_key: task.key,
        });
      }
    }
  }
}

export async function getWizardPhases(orgId: string): Promise<WizardPhaseRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('iso_wizard_phases')
    .select('*')
    .eq('organization_id', orgId)
    .order('phase_number');
  return (data ?? []) as WizardPhaseRow[];
}

export async function getPhaseWithTasks(orgId: string, phaseNumber: number): Promise<WizardPhaseWithTasks | null> {
  const supabase = await createClient();
  const { data: phase } = await supabase
    .from('iso_wizard_phases')
    .select('*')
    .eq('organization_id', orgId)
    .eq('phase_number', phaseNumber)
    .single();

  if (!phase) return null;

  const { data: tasks } = await supabase
    .from('iso_wizard_tasks')
    .select('*')
    .eq('phase_id', phase.id)
    .order('task_key');

  return { ...(phase as WizardPhaseRow), tasks: (tasks ?? []) as WizardTaskRow[] };
}

export async function getWizardSummary(orgId: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  overallPct: number;
  phaseSummary: WizardPhaseRow[];
}> {
  const phases = await getWizardPhases(orgId);
  const supabase = await createClient();

  const phaseIds = phases.map((p) => p.id);
  if (phaseIds.length === 0) {
    return { totalTasks: 0, completedTasks: 0, overallPct: 0, phaseSummary: [] };
  }

  const { data: tasks } = await supabase
    .from('iso_wizard_tasks')
    .select('status')
    .in('phase_id', phaseIds);

  const allTasks = tasks ?? [];
  const applicable = allTasks.filter((t) => t.status !== 'not_applicable');
  const completed = allTasks.filter((t) => t.status === 'completed');
  const pct = applicable.length === 0 ? 0 : Math.round((completed.length / applicable.length) * 100);

  return {
    totalTasks: applicable.length,
    completedTasks: completed.length,
    overallPct: pct,
    phaseSummary: phases,
  };
}
