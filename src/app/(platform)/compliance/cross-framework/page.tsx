import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { CrossFrameworkTable, type CrossMapping } from '@/features/compliance/components/CrossFrameworkTable';

export const dynamic = 'force-dynamic';

export default async function CrossFrameworkPage() {
  await requireOrg();
  const supabase = await createClient();

  // Fetch all requirement_mappings joined with both source & target requirements + frameworks
  const { data: mappings } = await supabase
    .from('requirement_mappings')
    .select(`
      id, mapping_strength, notes,
      source:framework_requirements!requirement_mappings_source_requirement_id_fkey(
        id, code, name, frameworks(id, code, name)
      ),
      target:framework_requirements!requirement_mappings_target_requirement_id_fkey(
        id, code, name, frameworks(id, code, name)
      )
    `)
    .limit(500);

  // Fetch all requirements for the "add mapping" selector
  const { data: reqs } = await supabase
    .from('framework_requirements')
    .select('id, code, name, frameworks(id, code, name)')
    .order('code')
    .limit(1000);

  type RawMapping = {
    id: string;
    mapping_strength: string | null;
    notes: string | null;
    source: { id: string; code: string; name: string; frameworks: { id: string; code: string; name: string } | null } | null;
    target: { id: string; code: string; name: string; frameworks: { id: string; code: string; name: string } | null } | null;
  };

  const rows: CrossMapping[] = ((mappings as unknown as RawMapping[]) ?? [])
    .filter((m) => m.source && m.target)
    .map((m) => ({
      id: m.id,
      source_requirement_id: m.source!.id,
      source_code: m.source!.code,
      source_title: m.source!.name,
      source_framework_id: m.source!.frameworks?.id ?? '',
      source_framework_name: m.source!.frameworks?.name ?? '',
      target_requirement_id: m.target!.id,
      target_code: m.target!.code,
      target_title: m.target!.name,
      target_framework_id: m.target!.frameworks?.id ?? '',
      target_framework_name: m.target!.frameworks?.name ?? '',
      mapping_strength: m.mapping_strength ?? 'related',
      notes: m.notes,
    }));

  type RawReq = {
    id: string;
    code: string;
    name: string;
    frameworks: { id: string; code: string; name: string } | null;
  };

  const requirements = ((reqs as unknown as RawReq[]) ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    title: r.name,
    framework_id: r.frameworks?.id ?? '',
    framework_name: r.frameworks?.name ?? 'Sin framework',
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapeo Cross-Framework"
        description="Equivalencias entre requisitos de distintos marcos normativos (ISO 27001, NIST, PCI DSS, etc.). Un control que cumple un requisito también puede cubrir su equivalente en otros frameworks."
      />

      <CrossFrameworkTable mappings={rows} requirements={requirements} />
    </div>
  );
}
