import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ── Label maps ──────────────────────────────────────────────────────────────

const TREATMENT_LABEL: Record<string, string> = {
  mitigate: 'Reducir / Mitigar',
  accept: 'Aceptar',
  avoid: 'Evitar',
  transfer: 'Transferir',
  share: 'Compartir',
};

const CONTROL_TYPE_LABEL: Record<string, string> = {
  preventive: 'Preventivo',
  detective: 'Detectivo',
  corrective: 'Correctivo',
  deterrent: 'Disuasivo',
  compensating: 'Compensatorio',
  recovery: 'Recuperación',
};

const AUTOMATION_LABEL: Record<string, string> = {
  manual: 'Manual',
  semi_automated: 'Semi-automatizado',
  fully_automated: 'Automatizado',
};

const LEVEL_TO_ZONE: Record<string, string> = {
  critical: 'Extremo',
  high: 'Alto',
  medium: 'Moderado',
  low: 'Bajo',
  negligible: 'Bajo',
};

const ZONE_FILL: Record<string, string> = {
  Extremo: 'B91C1C',
  Alto: 'B45309',
  Moderado: 'A16207',
  Bajo: '15803D',
};

const LEVEL_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
  negligible: 'Negligible',
};

// ── Types ────────────────────────────────────────────────────────────────────

interface RiskRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  risk_type: string | null;
  causes: string | null;
  consequences: string | null;
  activity_frequency: number | null;
  probability_label: string | null;
  impact_label: string | null;
  risk_zone: string | null;
  risk_level_inherent: string | null;
  risk_level_residual: string | null;
  treatment: string | null;
  treatment_justification: string | null;
  assets: { code: string; name: string } | null;
  asset_categories: { name: string } | null;
  threat_catalog: { code: string; name: string } | null;
}

interface ControlRow {
  id: string;
  code: string;
  name: string;
  control_type: string | null;
  automation_level: string | null;
  affects_probability_or_impact: string | null;
  is_documented: boolean | null;
  has_evidence: boolean | null;
  control_frequency_dafp: string | null;
}

interface PlanRow {
  code: string;
  title: string;
  description: string | null;
  start_date: string | null;
  target_date: string | null;
  notes: string | null;
}

interface PlanLinkRow {
  risk_scenario_id: string;
  treatment_plans: PlanRow | null;
}

interface MappingRow {
  risk_scenario_id: string;
  controls: ControlRow | null;
}

function fmt(v: string | null | undefined): string {
  return v ?? '';
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return '';
  try {
    return new Date(v).toLocaleDateString('es-CO', { dateStyle: 'short' });
  } catch {
    return v;
  }
}

function boolLabel(v: boolean | null | undefined): string {
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  return '';
}

// Parse "Responsable: X | Seguimiento: Y" from plan.notes
function parseNotesField(notes: string | null, field: 'responsable' | 'seguimiento'): string {
  if (!notes) return '';
  const key = field === 'responsable' ? 'Responsable:' : 'Seguimiento:';
  const idx = notes.indexOf(key);
  if (idx === -1) return '';
  const rest = notes.slice(idx + key.length).trim();
  const pipe = rest.indexOf('|');
  return (pipe === -1 ? rest : rest.slice(0, pipe)).trim();
}

// ── Section colors ───────────────────────────────────────────────────────────

const DARK_BLUE = '1B3A5C';
const MID_BLUE = '2D5F8A';
const TEAL = '0D6E6E';
const INDIGO = '3730A3';
const DARK_RED = '7F1D1D';
const WHITE = 'FFFFFF';
const LIGHT_BG = 'F2F7FB';
const LIGHT_TEAL = 'F0FDFA';
const LIGHT_INDIGO = 'EEF2FF';
const LIGHT_RED = 'FFF1F2';

// Column definition (31 cols)
const COLS = [
  // Risk identification (cols 1-3)
  { header: 'No. Riesgo',         width: 12,  section: 0 },
  { header: 'Proceso',            width: 22,  section: 0 },
  { header: 'Nombre del Riesgo',  width: 30,  section: 0 },
  // Risk inherent analysis (cols 4-13)
  { header: 'Activo',             width: 20,  section: 1 },
  { header: 'Amenaza',            width: 22,  section: 1 },
  { header: 'Descripción',        width: 35,  section: 1 },
  { header: 'Tipo de Riesgo',     width: 15,  section: 1 },
  { header: 'Causas / Vulnerabilidades', width: 32, section: 1 },
  { header: 'Consecuencias',      width: 30,  section: 1 },
  { header: 'Frec. Actividad',    width: 13,  section: 1 },
  { header: 'Probabilidad',       width: 14,  section: 1 },
  { header: 'Impacto',            width: 14,  section: 1 },
  { header: 'Zona Inherente',     width: 16,  section: 1 },
  // Controls (cols 14-21)
  { header: 'No. Control',        width: 13,  section: 2 },
  { header: 'Actividad de Control', width: 32, section: 2 },
  { header: 'Afectación',         width: 15,  section: 2 },
  { header: 'Tipo de Control',    width: 17,  section: 2 },
  { header: 'Implementación',     width: 18,  section: 2 },
  { header: 'Documentación',      width: 14,  section: 2 },
  { header: 'Evidencia',          width: 12,  section: 2 },
  { header: 'Frec. Control',      width: 15,  section: 2 },
  // Treatment & plan (cols 22-28)
  { header: 'Tratamiento',        width: 18,  section: 3 },
  { header: 'Comentario',         width: 25,  section: 3 },
  { header: 'Plan de Acción',     width: 32,  section: 3 },
  { header: 'Fecha Inicio',       width: 13,  section: 3 },
  { header: 'Fecha Final',        width: 13,  section: 3 },
  { header: 'Seguimiento',        width: 13,  section: 3 },
  { header: 'Responsable',        width: 22,  section: 3 },
  // Residual (cols 29-31)
  { header: 'Zona Residual',      width: 16,  section: 4 },
  { header: 'Nivel Residual',     width: 16,  section: 4 },
  { header: 'Estado',             width: 13,  section: 4 },
];

const SECTION_HEADERS = [
  { label: 'IDENTIFICACIÓN DEL RIESGO',        start: 1,  end: 3,  fill: DARK_BLUE },
  { label: 'ANÁLISIS INHERENTE',               start: 4,  end: 13, fill: MID_BLUE },
  { label: 'CONTROLES EXISTENTES',             start: 14, end: 21, fill: TEAL },
  { label: 'TRATAMIENTO Y PLAN DE ACCIÓN',     start: 22, end: 28, fill: INDIGO },
  { label: 'RIESGO RESIDUAL',                  start: 29, end: 31, fill: DARK_RED },
];

const SECTION_ROW_BG = ['F2F7FB', 'F2F7FB', 'F0FDFA', 'EEF2FF', 'FFF1F2'];

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  const { user, orgId } = await getCurrentOrg();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: 'Sin organización activa' }, { status: 403 });

  const supabase = await createClient();

  const [orgRes, risksRes] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', orgId).single(),
    supabase
      .from('risk_scenarios')
      .select(
        'id, code, name, description, risk_type, causes, consequences,' +
        'activity_frequency, probability_label, impact_label, risk_zone,' +
        'risk_level_inherent, risk_level_residual, treatment, treatment_justification,' +
        'assets(code, name), asset_categories(name), threat_catalog(code, name)',
      )
      .eq('organization_id', orgId)
      .order('code', { ascending: true }),
  ]);

  const risks = (risksRes.data ?? []) as unknown as RiskRow[];
  const riskIds = risks.map((r) => r.id);

  // Fetch controls and treatment plans in parallel when risks exist
  let controlsByRisk = new Map<string, ControlRow[]>();
  let planByRisk = new Map<string, PlanRow>();

  if (riskIds.length > 0) {
    const [mappingsRes, planLinksRes] = await Promise.all([
      supabase
        .from('control_risk_mappings')
        .select(
          'risk_scenario_id, controls(id, code, name, control_type, automation_level,' +
          'affects_probability_or_impact, is_documented, has_evidence, control_frequency_dafp)',
        )
        .in('risk_scenario_id', riskIds),
      supabase
        .from('treatment_plan_risks')
        .select(
          'risk_scenario_id, treatment_plans(code, title, description, start_date, target_date, notes)',
        )
        .in('risk_scenario_id', riskIds),
    ]);

    for (const m of (mappingsRes.data ?? []) as unknown as MappingRow[]) {
      if (!m.controls) continue;
      const arr = controlsByRisk.get(m.risk_scenario_id) ?? [];
      arr.push(m.controls);
      controlsByRisk.set(m.risk_scenario_id, arr);
    }

    for (const l of (planLinksRes.data ?? []) as unknown as PlanLinkRow[]) {
      if (!l.treatment_plans) continue;
      // Keep only first plan per risk
      if (!planByRisk.has(l.risk_scenario_id)) {
        planByRisk.set(l.risk_scenario_id, l.treatment_plans);
      }
    }
  }

  // Build expanded rows: one row per (risk, control), at least one per risk
  interface ExportRow {
    risk: RiskRow;
    control: ControlRow | null;
    plan: PlanRow | null;
    isFirstControl: boolean;
  }

  const exportRows: ExportRow[] = [];
  for (const risk of risks) {
    const controls = controlsByRisk.get(risk.id) ?? [];
    const plan = planByRisk.get(risk.id) ?? null;
    if (controls.length === 0) {
      exportRows.push({ risk, control: null, plan, isFirstControl: true });
    } else {
      controls.forEach((ctrl, i) => {
        exportRows.push({ risk, control: ctrl, plan, isFirstControl: i === 0 });
      });
    }
  }

  // ── Build workbook ──────────────────────────────────────────────────────────

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust - SGSI';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Mapa de Riesgos', {
    properties: { defaultColWidth: 18 },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  const totalCols = COLS.length;
  const lastColLetter = String.fromCharCode(64 + totalCols); // 'AE' for 31

  // Row 1: Title
  sheet.mergeCells(`A1:${lastColLetter}1`);
  const title = sheet.getCell('A1');
  title.value = 'MAPA DE RIESGOS — SEGURIDAD DE LA INFORMACIÓN (DAFP 2020)';
  title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: DARK_BLUE } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 32;

  // Row 2: Org + date
  sheet.mergeCells('A2:P2');
  sheet.getCell('A2').value = `Organización: ${orgRes.data?.name ?? 'N/D'}`;
  sheet.getCell('A2').font = { name: 'Calibri', size: 10, bold: true };
  sheet.mergeCells(`Q2:${lastColLetter}2`);
  sheet.getCell('Q2').value = `Fecha: ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`;
  sheet.getCell('Q2').alignment = { horizontal: 'right' };
  sheet.getCell('Q2').font = { name: 'Calibri', size: 10, color: { argb: '555555' } };

  // Row 3: Section group headers
  for (const sec of SECTION_HEADERS) {
    const startLetter = colLetter(sec.start);
    const endLetter = colLetter(sec.end);
    sheet.mergeCells(`${startLetter}3:${endLetter}3`);
    const cell = sheet.getCell(`${startLetter}3`);
    cell.value = sec.label;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sec.fill } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  sheet.getRow(3).height = 18;

  // Row 4: Column headers
  const headerRow = sheet.getRow(4);
  COLS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    const fillColor = [MID_BLUE, MID_BLUE, TEAL, INDIGO, DARK_RED][col.section];
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder('D0D0D0');
  });
  headerRow.height = 36;

  // Data rows
  exportRows.forEach(({ risk, control, plan }, idx) => {
    const rowNum = 5 + idx;
    const row = sheet.getRow(rowNum);
    const isEven = idx % 2 === 0;

    const zone = risk.risk_zone ?? LEVEL_TO_ZONE[risk.risk_level_inherent ?? ''] ?? '';
    const residualZone = LEVEL_TO_ZONE[risk.risk_level_residual ?? ''] ?? '';

    const values: string[] = [
      // Identification
      fmt(risk.code),
      fmt((risk.asset_categories as { name?: string } | null)?.name),
      fmt(risk.name),
      // Inherent analysis
      risk.assets ? `${risk.assets.code} — ${risk.assets.name}` : '',
      risk.threat_catalog ? `${risk.threat_catalog.code} — ${risk.threat_catalog.name}` : '',
      fmt(risk.description),
      fmt(risk.risk_type),
      fmt(risk.causes),
      fmt(risk.consequences),
      risk.activity_frequency != null ? String(risk.activity_frequency) : '',
      fmt(risk.probability_label),
      fmt(risk.impact_label),
      zone,
      // Controls
      control ? fmt(control.code) : '',
      control ? fmt(control.name) : '',
      control ? fmt(control.affects_probability_or_impact) : '',
      control ? (CONTROL_TYPE_LABEL[control.control_type ?? ''] ?? fmt(control.control_type)) : '',
      control ? (AUTOMATION_LABEL[control.automation_level ?? ''] ?? fmt(control.automation_level)) : '',
      control ? boolLabel(control.is_documented) : '',
      control ? boolLabel(control.has_evidence) : '',
      control ? fmt(control.control_frequency_dafp) : '',
      // Treatment
      TREATMENT_LABEL[risk.treatment ?? ''] ?? fmt(risk.treatment),
      fmt(risk.treatment_justification),
      plan ? fmt(plan.description ?? plan.title) : '',
      plan ? fmtDate(plan.start_date) : '',
      plan ? fmtDate(plan.target_date) : '',
      plan ? parseNotesField(plan.notes, 'seguimiento') : '',
      plan ? parseNotesField(plan.notes, 'responsable') : '',
      // Residual
      residualZone,
      LEVEL_LABEL[risk.risk_level_residual ?? ''] ?? fmt(risk.risk_level_residual),
      'Activo',
    ];

    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 9 };
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = thinBorder('E0E0E0');
      if (isEven) {
        const bgColor = SECTION_ROW_BG[COLS[i].section];
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }
    });

    // Color-code zone cells
    colorZoneCell(row.getCell(13), zone);        // Zona Inherente
    colorZoneCell(row.getCell(29), residualZone); // Zona Residual

    row.height = 40;
  });

  // Column widths
  COLS.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width;
  });

  // Freeze top 4 rows + first 3 columns
  sheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 4 }];

  // AutoFilter on header row
  sheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + exportRows.length, column: totalCols },
  };

  // Summary sheet by process
  const summary = workbook.addWorksheet('Resumen por Proceso', {
    properties: { defaultColWidth: 22 },
  });
  summary.getRow(1).values = ['Proceso', 'Total Riesgos', 'Extremo', 'Alto', 'Moderado', 'Bajo', 'Tratamiento'];
  summary.getRow(1).font = { bold: true, color: { argb: WHITE } };
  const sumRow1 = summary.getRow(1);
  sumRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MID_BLUE } };
  sumRow1.height = 24;

  const byProcess = new Map<string, RiskRow[]>();
  for (const r of risks) {
    const proc = (r.asset_categories as { name?: string } | null)?.name ?? 'Sin proceso';
    const arr = byProcess.get(proc) ?? [];
    arr.push(r);
    byProcess.set(proc, arr);
  }

  let sumIdx = 2;
  for (const [proc, procRisks] of byProcess) {
    const extremo = procRisks.filter((r) => LEVEL_TO_ZONE[r.risk_level_residual ?? ''] === 'Extremo').length;
    const alto    = procRisks.filter((r) => LEVEL_TO_ZONE[r.risk_level_residual ?? ''] === 'Alto').length;
    const mod     = procRisks.filter((r) => LEVEL_TO_ZONE[r.risk_level_residual ?? ''] === 'Moderado').length;
    const bajo    = procRisks.filter((r) => LEVEL_TO_ZONE[r.risk_level_residual ?? ''] === 'Bajo').length;
    const treatments = [...new Set(procRisks.map((r) => TREATMENT_LABEL[r.treatment ?? ''] ?? r.treatment ?? ''))].filter(Boolean).join(', ');
    summary.getRow(sumIdx).values = [proc, procRisks.length, extremo, alto, mod, bajo, treatments];
    sumIdx++;
  }
  summary.getColumn(1).width = 40;
  summary.getColumn(7).width = 35;

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `mapa-riesgos-dafp-${date}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function colLetter(col: number): string {
  // col is 1-based
  let result = '';
  while (col > 0) {
    const rem = (col - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    col = Math.floor((col - 1) / 26);
  }
  return result;
}

function thinBorder(argb: string): Partial<ExcelJS.Borders> {
  const s: ExcelJS.Border = { style: 'thin', color: { argb } };
  return { top: s, bottom: s, left: s, right: s };
}

function colorZoneCell(cell: ExcelJS.Cell, zone: string) {
  const fill = ZONE_FILL[zone];
  if (!fill) return;
  cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: WHITE } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  cell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
}
