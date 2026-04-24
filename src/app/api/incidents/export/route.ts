import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ── Label maps ───────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const SEVERITY_COLORS: Record<string, { bg: string; fg: string }> = {
  critical: { bg: 'FFFEE2E2', fg: 'FF991B1B' },
  high:     { bg: 'FFFFF7ED', fg: 'FFB45309' },
  medium:   { bg: 'FFFEFCE8', fg: 'FFA16207' },
  low:      { bg: 'FFF0F9FF', fg: 'FF0369A1' },
};

// ── Type ─────────────────────────────────────────────────────────────────────

interface IncidentRow {
  code: string | null;
  title: string | null;
  severity: string | null;
  status: string | null;
  category: string | null;
  source: string | null;
  detected_at: string | null;
  contained_at: string | null;
  closed_at: string | null;
  root_cause: string | null;
  lessons_learned: string | null;
  affected_users: number | null;
  financial_impact: number | null;
  data_breach: boolean | null;
  pii_exposed: boolean | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  return String(v);
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

function thinBorder(argb: string): Partial<ExcelJS.Borders> {
  const s: ExcelJS.Border = { style: 'thin', color: { argb } };
  return { top: s, bottom: s, left: s, right: s };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  const { user, orgId } = await getCurrentOrg();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: 'Sin organización activa' }, { status: 403 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('incidents')
    .select(
      'code, title, severity, status, category, source,' +
      'detected_at, contained_at, closed_at,' +
      'root_cause, lessons_learned,' +
      'affected_users, financial_impact, data_breach, pii_exposed,' +
      'created_at',
    )
    .eq('organization_id', orgId)
    .order('detected_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const incidents = (data ?? []) as unknown as IncidentRow[];

  // ── Build workbook ──────────────────────────────────────────────────────────

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BC Compliance';
  wb.created = new Date();

  const ws = wb.addWorksheet('Incidentes', {
    properties: { defaultColWidth: 18 },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  const HEADERS = [
    'Código', 'Título', 'Severidad', 'Estado', 'Categoría', 'Fuente',
    'Detectado', 'Contenido', 'Cerrado',
    'Causa Raíz', 'Lecciones Aprendidas',
    'Usuarios Afectados', 'Impacto Financiero', 'Brecha de Datos', 'PII Expuesta',
    'Fecha Creación',
  ];

  const COL_WIDTHS = [
    12, 32, 12, 14, 18, 16,
    16, 16, 16,
    35, 35,
    18, 18, 16, 14,
    16,
  ];

  // Header row
  ws.addRow(HEADERS);
  const headerRow = ws.lastRow!;
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder('D0D0D0');
  });

  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Data rows
  incidents.forEach((inc, idx) => {
    const row = ws.addRow([
      fmt(inc.code),
      fmt(inc.title),
      SEVERITY_LABELS[inc.severity ?? ''] ?? fmt(inc.severity),
      fmt(inc.status),
      fmt(inc.category),
      fmt(inc.source),
      fmtDate(inc.detected_at),
      fmtDate(inc.contained_at),
      fmtDate(inc.closed_at),
      fmt(inc.root_cause),
      fmt(inc.lessons_learned),
      inc.affected_users != null ? inc.affected_users : '',
      inc.financial_impact != null ? inc.financial_impact : '',
      boolLabel(inc.data_breach),
      boolLabel(inc.pii_exposed),
      fmtDate(inc.created_at),
    ]);

    const isEven = idx % 2 === 0;
    row.height = 20;
    row.eachCell((cell) => {
      cell.font = { size: 9 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = thinBorder('E8E8E8');
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });

    // Color-code "Severidad" (column 3)
    const sevKey = inc.severity ?? '';
    const colors = SEVERITY_COLORS[sevKey];
    if (colors) {
      const sevCell = row.getCell(3);
      sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
      sevCell.font = { size: 9, bold: true, color: { argb: colors.fg } };
    }
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'P1' };

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="incidentes-${date}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
