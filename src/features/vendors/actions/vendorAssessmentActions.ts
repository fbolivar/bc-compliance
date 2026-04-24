'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';

export interface QuestionnaireResponses {
  iso27001: boolean;
  soc2: boolean;
  dpa: boolean;
  pentest: boolean;
  bcp: boolean;
  access_controls: boolean;
  training: boolean;
  incident_policy: boolean;
  had_incidents: boolean;       // risk factor (yes = bad)
  subcontracts_unvetted: boolean; // risk factor (yes = bad)
}

/** Compute 0-100 score from questionnaire answers. */
export function computeAssessmentScore(q: QuestionnaireResponses): number {
  const positive: (keyof QuestionnaireResponses)[] = [
    'iso27001', 'soc2', 'dpa', 'pentest',
    'bcp', 'access_controls', 'training', 'incident_policy',
  ];
  const risk: (keyof QuestionnaireResponses)[] = ['had_incidents', 'subcontracts_unvetted'];

  let score = 0;
  for (const k of positive) if (q[k]) score += 10;
  for (const k of risk) if (!q[k]) score += 10;
  return Math.min(100, Math.max(0, score));
}

/** Derive risk level label from score. */
export function scoreToRiskLevel(score: number): string {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

export interface CreateAssessmentResult {
  ok: boolean;
  error?: string;
}

export async function createVendorAssessment(
  vendorId: string,
  formData: FormData,
): Promise<CreateAssessmentResult> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { ok: false, error: 'Sin organización activa' };

  const q: QuestionnaireResponses = {
    iso27001: formData.get('iso27001') === 'true',
    soc2: formData.get('soc2') === 'true',
    dpa: formData.get('dpa') === 'true',
    pentest: formData.get('pentest') === 'true',
    bcp: formData.get('bcp') === 'true',
    access_controls: formData.get('access_controls') === 'true',
    training: formData.get('training') === 'true',
    incident_policy: formData.get('incident_policy') === 'true',
    had_incidents: formData.get('had_incidents') === 'true',
    subcontracts_unvetted: formData.get('subcontracts_unvetted') === 'true',
  };

  const score = computeAssessmentScore(q);
  const risk_level = scoreToRiskLevel(score);
  const next_date = (formData.get('next_assessment_date') as string | null)?.trim() || null;
  const notes = (formData.get('notes') as string | null)?.trim() || null;
  const assessment_date = (formData.get('assessment_date') as string | null)?.trim()
    || new Date().toISOString().slice(0, 10);

  const supabase = await createClient();

  const { error } = await supabase.from('vendor_assessments').insert({
    organization_id: orgId,
    vendor_id: vendorId,
    assessment_date,
    overall_score: score,
    risk_level,
    status: 'completed',
    questionnaire_responses: q,
    next_assessment_date: next_date,
    notes,
  });

  if (error) return { ok: false, error: error.message };

  // Update vendor's risk_score and next_assessment_date
  await supabase
    .from('vendors')
    .update({
      risk_score: score,
      risk_level,
      last_assessment_date: assessment_date,
      next_assessment_date: next_date,
    })
    .eq('id', vendorId)
    .eq('organization_id', orgId);

  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}
