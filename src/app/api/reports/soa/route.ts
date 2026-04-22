import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { styleHeaderRow, addTitleBlock, xlsxResponseHeaders } from '@/features/reporting/services/xlsxHelpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { orgId, organization } = await requireOrg();
  const supabase = await createClient();
  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';

  // Fetch SOA entries with requirement + framework details
  const { data: entries } = await supabase
    .from('soa_entries')
    .select(`
      id, is_applicable, justification, compliance_status, implementation_status, notes, control_ids,
      framework_requirements(code, name, description, frameworks(code, name))
    `)
    .eq('organization_id', orgId);

  type Raw = {
    id: string;
    is_applicable: boolean;
    justification: string | null;
    compliance_status: string;
    implementation_status: string;
    notes: string | null;
    control_ids: string[] | null;
    framework_requirements: {
      code: string;
      name: string;
      description: string | null;
      frameworks: { code: string; name: string } | null;
    } | null;
  };

  // Fetch all control_requirement_mappings to enrich with actual mapped controls
  const { data: ctrlMaps } = await supabase
    .from('control_requirement_mappings')
    .select(`
      requirement_id,
      coverage_percentage,
      controls(code, name, status)
    `)
    .eq('organization_id', orgId);

  type CtrlMap = {
    requirement_id: string;
    coverage_percentage: number;
    controls: { code: string; name: string; status: string } | null;
  };

  // Build controls by requirement_id (since SOA entries don't carry requirement_id in select above,
  // refetch them with requirement_id explicitly)
  const { data: entriesWithReqId } = await supabase
    .from('soa_entries')
    .select('id, requirement_id')
    .eq('organization_id', orgId);
  const reqByEntry = new Map((entriesWithReqId ?? []).map((e) => [e.id, e.requirement_id]));

  const ctrlsByReq = new Map<string, string[]>();
  for (const m of (ctrlMaps ?? []) as unknown as CtrlMap[]) {
    if (!m.controls) continue;
    const label = `${m.controls.code} (${m.controls.status === 'implemented' ? 'OK' : m.controls.status === 'partially_implemented' ? 'Parcial' : 'Pendiente'} ${m.coverage_percentage}%)`;
    if (!ctrlsByReq.has(m.requirement_id)) ctrlsByReq.set(m.requirement_id, []);
    ctrlsByReq.get(m.requirement_id)!.push(label);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust';
  workbook.created = new Date();

  // Group entries by framework
  type EnrichedEntry = Raw & { controls_labels: string };
  const byFw = new Map<string, EnrichedEntry[]>();
  for (const e of (entries ?? []) as unknown as Raw[]) {
    const fwName = e.framework_requirements?.frameworks?.name ?? 'Sin framework';
    const reqId = reqByEntry.get(e.id) ?? '';
    const labels = (ctrlsByReq.get(reqId) ?? []).join('; ');
    if (!byFw.has(fwName)) byFw.set(fwName, []);
    byFw.get(fwName)!.push({ ...e, controls_labels: labels });
  }

  for (const [fwName, fwEntries] of byFw) {
    const sheetName = fwName.substring(0, 28).replace(/[\\/*?:\[\]]/g, '');
    const s = workbook.addWorksheet(sheetName);

    s.columns = [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Requisito', key: 'name', width: 48 },
      { header: 'Aplicable', key: 'applicable', width: 11 },
      { header: 'Justificación aplicabilidad', key: 'just', width: 50 },
      { header: 'Estado implementación', key: 'impl', width: 20 },
      { header: 'Cumplimiento', key: 'compliance', width: 18 },
      { header: 'Controles vinculados', key: 'ctrls', width: 60 },
      { header: 'Notas', key: 'notes', width: 40 },
    ];

    for (const e of fwEntries) {
      s.addRow({
        code: e.framework_requirements?.code ?? '',
        name: e.framework_requirements?.name ?? '',
        applicable: e.is_applicable ? 'Sí' : 'No',
        just: e.justification ?? '',
        impl: labelImpl(e.implementation_status),
        compliance: labelCompliance(e.compliance_status),
        ctrls: e.controls_labels,
        notes: e.notes ?? '',
      });
    }

    styleHeaderRow(s);
    addTitleBlock(s, `SOA — ${fwName}`, orgName, s.columns.length);
  }

  if (byFw.size === 0) {
    const s = workbook.addWorksheet('SOA');
    s.columns = [{ header: 'Sin datos', key: 'x', width: 40 }];
    addTitleBlock(s, 'Declaración de Aplicabilidad (SOA)', orgName, 1);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `bc-trust-soa-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer, { headers: xlsxResponseHeaders(filename) });
}

function labelImpl(s: string): string {
  const map: Record<string, string> = {
    implemented: 'Implementado',
    partially_implemented: 'Parcial',
    planned: 'Planificado',
    not_implemented: 'No implementado',
    not_applicable: 'No aplica',
    not_assessed: 'Sin evaluar',
  };
  return map[s] ?? s;
}

function labelCompliance(s: string): string {
  const map: Record<string, string> = {
    compliant: 'Cumple',
    partially_compliant: 'Parcial',
    non_compliant: 'No cumple',
    not_assessed: 'Sin evaluar',
    not_applicable: 'No aplica',
  };
  return map[s] ?? s;
}
