'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/shared/lib/audit';

export type ActionResult = {
  success?: boolean;
  error?: string;
};

const COMPLIANCE_MAP: Record<string, string> = {
  implemented: 'compliant',
  partially_implemented: 'partially_compliant',
  not_implemented: 'non_compliant',
  planned: 'non_compliant',
  not_applicable: 'not_applicable',
};

function revalidateCompliancePaths() {
  revalidatePath('/compliance');
  revalidatePath('/compliance/soa');
  revalidatePath('/compliance/gap-analysis');
}

export async function updateSoaEntry(
  entryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const implementation_status = formData.get('implementation_status') as string;
  const is_applicable = formData.get('is_applicable') === 'true';
  const justification = formData.get('justification') as string;
  const notes = formData.get('notes') as string;

  const compliance_status = is_applicable
    ? (COMPLIANCE_MAP[implementation_status] ?? 'not_assessed')
    : 'not_applicable';

  const { error } = await supabase
    .from('soa_entries')
    .update({
      implementation_status: implementation_status || 'not_implemented',
      compliance_status,
      is_applicable,
      justification: justification || '',
      notes: notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', entryId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'soa_entries',
    recordId: entryId,
    description: `SOA entry actualizada: ${implementation_status}`,
  });

  revalidateCompliancePaths();
  return { success: true };
}

export async function bulkUpdateSoaStatus(
  entryIds: string[],
  status: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('soa_entries')
    .update({
      implementation_status: status,
      compliance_status: COMPLIANCE_MAP[status] ?? 'not_assessed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .in('id', entryIds);

  if (error) return { error: error.message };

  revalidateCompliancePaths();
  return { success: true };
}
