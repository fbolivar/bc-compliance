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

  // Fetch all SOA entries that are NOT fully compliant
  const { data: entries } = await supabase
    .from('soa_entries')
    .select(`
      id, is_applicable, implementation_status, compliance_status, justification,
      framework_requirements(code, name, description, is_mandatory, frameworks(code, name))
    `)
    .eq('organization_id', orgId)
    .eq('is_applicable', true)
    .neq('implementation_status', 'implemented');

  type Raw = {
    id: string;
    is_applicable: boolean;
    implementation_status: string;
    compliance_status: string;
    justification: string | null;
    framework_requirements: {
      code: string;
      name: string;
      description: string | null;
      is_mandatory: boolean;
      frameworks: { code: string; name: string } | null;
    } | null;
  };

  const rows = (entries ?? []) as unknown as Raw[];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust';
  workbook.created = new Date();

  // Sheet 1: all gaps
  const s1 = workbook.addWorksheet('Brechas consolidadas');
  s1.columns = [
    { header: 'Prioridad', key: 'priority', width: 12 },
    { header: 'Framework', key: 'fw', width: 24 },
    { header: 'Código', key: 'code', width: 14 },
    { header: 'Requisito', key: 'name', width: 46 },
    { header: 'Mandatorio', key: 'mand', width: 12 },
    { header: 'Estado actual', key: 'impl', width: 20 },
    { header: 'Cumplimiento', key: 'compliance', width: 18 },
    { header: 'Acción recomendada', key: 'action', width: 60 },
  ];

  // Sort by priority
  const priorityScore = (r: Raw): number => {
    const mand = r.framework_requirements?.is_mandatory ? 2 : 0;
    const impact = r.implementation_status === 'not_implemented' ? 3 : r.implementation_status === 'planned' ? 2 : 1;
    return mand + impact;
  };
  rows.sort((a, b) => priorityScore(b) - priorityScore(a));

  for (const e of rows) {
    const p = priorityScore(e);
    const priority = p >= 4 ? 'Crítica' : p >= 3 ? 'Alta' : p >= 2 ? 'Media' : 'Baja';
    const action = recommendAction(e.implementation_status, e.framework_requirements?.is_mandatory ?? false);
    const row = s1.addRow({
      priority,
      fw: e.framework_requirements?.frameworks?.name ?? '',
      code: e.framework_requirements?.code ?? '',
      name: e.framework_requirements?.name ?? '',
      mand: e.framework_requirements?.is_mandatory ? 'Sí' : 'No',
      impl: labelImpl(e.implementation_status),
      compliance: labelCompliance(e.compliance_status),
      action,
    });

    // Color priority cell
    const argb = p >= 4 ? 'FFFECACA' : p >= 3 ? 'FFFED7AA' : p >= 2 ? 'FFFEF3C7' : 'FFE0E7FF';
    row.getCell('priority').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
  }

  styleHeaderRow(s1, 'FFF59E0B');
  addTitleBlock(s1, 'Análisis de Brechas Multi-Framework', orgName, s1.columns.length);

  // Sheet 2: summary by framework
  const s2 = workbook.addWorksheet('Resumen por framework');
  s2.columns = [
    { header: 'Framework', key: 'fw', width: 30 },
    { header: 'Total brechas', key: 'total', width: 14 },
    { header: 'Críticas', key: 'crit', width: 12 },
    { header: 'Altas', key: 'high', width: 12 },
    { header: 'Medias/Bajas', key: 'med', width: 14 },
  ];

  const byFw = new Map<string, { total: number; crit: number; high: number; med: number }>();
  for (const e of rows) {
    const fw = e.framework_requirements?.frameworks?.name ?? 'Sin framework';
    const p = priorityScore(e);
    const cur = byFw.get(fw) ?? { total: 0, crit: 0, high: 0, med: 0 };
    cur.total++;
    if (p >= 4) cur.crit++;
    else if (p >= 3) cur.high++;
    else cur.med++;
    byFw.set(fw, cur);
  }

  for (const [fw, stats] of byFw) {
    s2.addRow({ fw, ...stats });
  }

  styleHeaderRow(s2, 'FFF59E0B');
  addTitleBlock(s2, 'Resumen por Framework', orgName, s2.columns.length);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `bc-trust-gap-analysis-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer, { headers: xlsxResponseHeaders(filename) });
}

function recommendAction(status: string, mandatory: boolean): string {
  const prefix = mandatory ? '[Mandatorio] ' : '';
  switch (status) {
    case 'not_implemented':
      return `${prefix}Asignar responsable, definir plan de implementación y fecha objetivo. Vincular a control existente o crear nuevo.`;
    case 'partially_implemented':
      return `${prefix}Identificar brechas específicas del control existente. Completar implementación y validar cobertura.`;
    case 'planned':
      return `${prefix}Ejecutar plan definido. Actualizar estado al completar y registrar evidencia.`;
    case 'not_assessed':
      return `${prefix}Realizar evaluación inicial del requisito. Determinar aplicabilidad y estado actual.`;
    default:
      return `${prefix}Revisar estado y documentar próximos pasos.`;
  }
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
