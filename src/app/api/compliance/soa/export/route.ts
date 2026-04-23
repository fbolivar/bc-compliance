import { NextResponse, type NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RequirementRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  framework_id: string;
  frameworks: { id: string; code: string; name: string; version: string | null } | null;
}

interface SoaEntryRow {
  id: string;
  is_applicable: boolean | null;
  justification: string | null;
  compliance_status: string | null;
  implementation_status: string | null;
  notes: string | null;
  control_ids: string[] | null;
  reviewed_at: string | null;
  framework_requirements: RequirementRow | null;
}

interface ControlRow {
  id: string;
  code: string;
  name: string;
}

const IMPL_LABEL: Record<string, string> = {
  not_implemented: 'No implementado',
  planned: 'Planificado',
  partially_implemented: 'Parcialmente implementado',
  implemented: 'Implementado',
  not_applicable: 'No aplicable',
};

const COMPLIANCE_LABEL: Record<string, string> = {
  compliant: 'Cumple',
  partially_compliant: 'Parcial',
  non_compliant: 'No cumple',
  not_assessed: 'No evaluado',
  not_applicable: 'No aplicable',
};

export async function GET(req: NextRequest) {
  const { user, orgId } = await getCurrentOrg();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: 'Sin organización activa' }, { status: 403 });

  const url = new URL(req.url);
  const frameworkId = url.searchParams.get('framework_id');

  const supabase = await createClient();

  // Fetch org info
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  // Fetch SOA entries, optionally scoped to one framework
  let query = supabase
    .from('soa_entries')
    .select(
      'id, is_applicable, justification, compliance_status, implementation_status, notes, control_ids, reviewed_at, framework_requirements(id, code, name, description, framework_id, frameworks(id, code, name, version))'
    )
    .eq('organization_id', orgId);

  const { data: entriesRaw } = await query.order('created_at', { ascending: true });
  let entries = (entriesRaw ?? []) as unknown as SoaEntryRow[];

  if (frameworkId) {
    entries = entries.filter((e) => e.framework_requirements?.framework_id === frameworkId);
  }

  // Fetch controls referenced by any entry (for the "Controles que implementan" column)
  const controlIds = Array.from(
    new Set(entries.flatMap((e) => (e.control_ids ?? []).filter(Boolean))),
  );
  const controlsById = new Map<string, ControlRow>();
  if (controlIds.length > 0) {
    const { data: controls } = await supabase
      .from('controls')
      .select('id, code, name')
      .in('id', controlIds);
    for (const c of (controls ?? []) as ControlRow[]) {
      controlsById.set(c.id, c);
    }
  }

  // Sort by framework then requirement code (A.5.1, A.5.2, A.5.10 → natural order attempt)
  entries.sort((a, b) => {
    const aFw = a.framework_requirements?.frameworks?.name ?? '';
    const bFw = b.framework_requirements?.frameworks?.name ?? '';
    if (aFw !== bFw) return aFw.localeCompare(bFw);
    return codeSort(a.framework_requirements?.code ?? '', b.framework_requirements?.code ?? '');
  });

  // Build workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust - SGSI';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Declaración de Aplicabilidad', {
    properties: { defaultColWidth: 20 },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  // Row 1: Title
  sheet.mergeCells('A1:J1');
  const title = sheet.getCell('A1');
  title.value = 'DECLARACIÓN DE APLICABILIDAD (SOA)';
  title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: '1B3A5C' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 32;

  // Row 2: Org + date
  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `Organización: ${org?.name ?? 'N/D'}`;
  sheet.getCell('A2').font = { name: 'Calibri', size: 10, bold: true };
  sheet.mergeCells('G2:J2');
  sheet.getCell('G2').value = `Fecha: ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`;
  sheet.getCell('G2').alignment = { horizontal: 'right' };
  sheet.getCell('G2').font = { name: 'Calibri', size: 10, color: { argb: '666666' } };

  // Row 3: Framework scope
  sheet.mergeCells('A3:J3');
  const scope = frameworkId
    ? `Marco: ${entries[0]?.framework_requirements?.frameworks?.name ?? ''} ${entries[0]?.framework_requirements?.frameworks?.version ?? ''}`
    : 'Marco: Todos los marcos de referencia aplicables';
  sheet.getCell('A3').value = scope;
  sheet.getCell('A3').font = { name: 'Calibri', size: 10, italic: true, color: { argb: '555555' } };

  sheet.getRow(4).height = 4;

  // Row 5: Headers
  const headers = [
    'Marco',
    'Código',
    'Requisito / Control',
    'Descripción',
    'Aplicable',
    'Justificación de aplicabilidad',
    'Estado de implementación',
    'Estado de cumplimiento',
    'Controles PNNC que lo implementan',
    'Notas / Observaciones',
  ];
  const headerRow = sheet.getRow(5);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2D5F8A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'B0C4D8' } },
      bottom: { style: 'thin', color: { argb: 'B0C4D8' } },
      left: { style: 'thin', color: { argb: 'B0C4D8' } },
      right: { style: 'thin', color: { argb: 'B0C4D8' } },
    };
  });
  headerRow.height = 36;

  // Data rows
  entries.forEach((entry, idx) => {
    const rowIdx = 6 + idx;
    const row = sheet.getRow(rowIdx);
    const req = entry.framework_requirements;
    const controlsText = (entry.control_ids ?? [])
      .map((id) => controlsById.get(id))
      .filter(Boolean)
      .map((c) => `${c!.code} — ${c!.name}`)
      .join('\n');

    const values: (string | null)[] = [
      req?.frameworks?.name ?? '',
      req?.code ?? '',
      req?.name ?? '',
      req?.description ?? '',
      entry.is_applicable === true ? 'Sí' : entry.is_applicable === false ? 'No' : 'Sin decidir',
      entry.justification ?? '',
      entry.implementation_status ? (IMPL_LABEL[entry.implementation_status] ?? entry.implementation_status) : '',
      entry.compliance_status ? (COMPLIANCE_LABEL[entry.compliance_status] ?? entry.compliance_status) : '',
      controlsText,
      entry.notes ?? '',
    ];

    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 9 };
      cell.alignment = { vertical: 'top', wrapText: true, horizontal: i === 4 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'thin', color: { argb: 'E0E0E0' } },
        right: { style: 'thin', color: { argb: 'E0E0E0' } },
      };
      if (idx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F7FB' } };
      }
    });

    // Color-code applicability (col 5) and implementation (col 7)
    colorCodeApplicable(row.getCell(5), entry.is_applicable);
    colorCodeImplementation(row.getCell(7), entry.implementation_status);

    row.height = 48;
  });

  // Column widths (10 cols)
  const widths = [22, 10, 30, 40, 12, 40, 22, 18, 35, 30];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  // Freeze header + autofilter
  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 5 }];
  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5 + entries.length, column: headers.length },
  };

  // Summary sheet
  const summary = workbook.addWorksheet('Resumen por Marco', {
    properties: { defaultColWidth: 20 },
  });
  summary.getRow(1).values = ['Marco', 'Total', 'Aplicable', 'Implementado', 'Parcial', 'No implementado', 'No aplicable'];
  summary.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  summary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2D5F8A' } };

  const byFramework = new Map<string, SoaEntryRow[]>();
  for (const e of entries) {
    const key = e.framework_requirements?.frameworks?.name ?? 'Sin marco';
    const arr = byFramework.get(key) ?? [];
    arr.push(e);
    byFramework.set(key, arr);
  }

  let rIdx = 2;
  for (const [fwName, fwEntries] of byFramework) {
    const applicable = fwEntries.filter((e) => e.is_applicable === true).length;
    const implemented = fwEntries.filter((e) => e.implementation_status === 'implemented').length;
    const partial = fwEntries.filter((e) => e.implementation_status === 'partially_implemented').length;
    const notImpl = fwEntries.filter((e) => e.implementation_status === 'not_implemented').length;
    const notAppl = fwEntries.filter((e) => e.implementation_status === 'not_applicable').length;

    summary.getRow(rIdx).values = [fwName, fwEntries.length, applicable, implemented, partial, notImpl, notAppl];
    rIdx++;
  }
  summary.getColumn(1).width = 40;

  const buffer = await workbook.xlsx.writeBuffer();
  const fwSuffix = frameworkId
    ? (entries[0]?.framework_requirements?.frameworks?.code ?? 'framework')
    : 'todos';
  const filename = `soa-${fwSuffix}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/** Sort requirement codes like A.5.1, A.5.2, A.5.10 naturally instead of lexically. */
function codeSort(a: string, b: string): number {
  const segsA = a.split(/[.\-]/).map((s) => {
    const n = parseInt(s, 10);
    return isNaN(n) ? s : n;
  });
  const segsB = b.split(/[.\-]/).map((s) => {
    const n = parseInt(s, 10);
    return isNaN(n) ? s : n;
  });
  const len = Math.max(segsA.length, segsB.length);
  for (let i = 0; i < len; i++) {
    const sa = segsA[i];
    const sb = segsB[i];
    if (sa === sb) continue;
    if (sa === undefined) return -1;
    if (sb === undefined) return 1;
    if (typeof sa === 'number' && typeof sb === 'number') return sa - sb;
    return String(sa).localeCompare(String(sb));
  }
  return 0;
}

function colorCodeApplicable(cell: ExcelJS.Cell, v: boolean | null) {
  if (v === true) {
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '15803D' } };
  } else if (v === false) {
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '9A3412' } };
  } else {
    cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '888888' } };
  }
}

function colorCodeImplementation(cell: ExcelJS.Cell, s: string | null) {
  switch (s) {
    case 'implemented':
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '15803D' } }; break;
    case 'partially_implemented':
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'B45309' } }; break;
    case 'not_implemented':
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'B91C1C' } }; break;
    case 'not_applicable':
      cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '888888' } }; break;
  }
}
