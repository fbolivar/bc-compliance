'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';
import {
  type QuestionnaireResponses,
  computeAssessmentScore,
  scoreToRiskLevel,
} from '../lib/assessmentHelpers';

export type { QuestionnaireResponses };

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
