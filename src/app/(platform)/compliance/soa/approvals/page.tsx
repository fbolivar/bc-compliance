import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { SoaApprovalsClient } from '@/features/compliance/components/SoaApprovalsClient';

export const dynamic = 'force-dynamic';

export default async function SoaApprovalsPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('soa_entries')
    .select(`
      id, implementation_status, compliance_status, justification,
      pending_status, pending_compliance_status, pending_justification,
      pending_changed_by, pending_changed_at,
      framework_requirements(code, name, frameworks(name))
    `)
    .eq('organization_id', orgId)
    .not('pending_status', 'is', null)
    .order('pending_changed_at', { ascending: false });

  type Raw = {
    id: string;
    implementation_status: string;
    compliance_status: string;
    justification: string | null;
    pending_status: string;
    pending_compliance_status: string;
    pending_justification: string | null;
    pending_changed_by: string | null;
    pending_changed_at: string | null;
    framework_requirements: { code: string; name: string; frameworks: { name: string } | null } | null;
  };

  const items = ((pending as unknown as Raw[]) ?? []).map((e) => ({
    id: e.id,
    requirement_code: e.framework_requirements?.code ?? '',
    requirement_name: e.framework_requirements?.name ?? '',
    framework_name: e.framework_requirements?.frameworks?.name ?? '',
    current_status: e.implementation_status,
    proposed_status: e.pending_status,
    current_compliance: e.compliance_status,
    proposed_compliance: e.pending_compliance_status,
    proposed_justification: e.pending_justification,
    proposed_at: e.pending_changed_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aprobaciones SOA"
        description="Cambios propuestos al Statement of Applicability pendientes de aprobación. Solo usuarios con rol aprobador deben validar estos cambios para mantener trazabilidad de auditoría."
      />
      <SoaApprovalsClient items={items} />
    </div>
  );
}
