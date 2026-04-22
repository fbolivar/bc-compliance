import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { ControlsMappingTable, type MappingRow } from '@/features/compliance/components/ControlsMappingTable';

export const dynamic = 'force-dynamic';

export default async function ControlsMappingPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { data: mappings } = await supabase
    .from('control_requirement_mappings')
    .select(`
      id,
      control_id,
      requirement_id,
      coverage_percentage,
      compliance_status,
      controls(code, name, status),
      framework_requirements(code, name, framework_id, frameworks(name))
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  type Raw = {
    id: string;
    control_id: string;
    requirement_id: string;
    coverage_percentage: number;
    compliance_status: string;
    controls: { code: string; name: string; status: string } | null;
    framework_requirements: {
      code: string;
      name: string;
      framework_id: string;
      frameworks: { name: string } | null;
    } | null;
  };

  const rows: MappingRow[] = ((mappings as unknown as Raw[]) ?? []).map((m) => ({
    id: m.id,
    control_id: m.control_id,
    control_code: m.controls?.code ?? '—',
    control_name: m.controls?.name ?? '—',
    control_status: m.controls?.status ?? '',
    requirement_id: m.requirement_id,
    requirement_code: m.framework_requirements?.code ?? '—',
    requirement_title: m.framework_requirements?.name ?? '—',
    framework_name: m.framework_requirements?.frameworks?.name ?? '',
    coverage_percentage: m.coverage_percentage ?? 0,
    compliance_status: m.compliance_status ?? 'not_assessed',
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapeo de Controles"
        description="Mapeo de controles a requisitos de frameworks normativos. Gestiona los vínculos desde el detalle de cada control."
      />

      <ControlsMappingTable items={rows} />
    </div>
  );
}
