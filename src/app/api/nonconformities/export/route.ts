import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ── Label maps ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  major: 'Mayor',
  minor: 'Menor',
  observation: 'Observación',
};

const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  major:       { bg: 'FFFEE2E2', fg: 'FF991B1B' },
  minor:       { bg: 'FFFFF7ED', fg: 'FFB45309' },
  observation: { bg: 'FFF0F9FF', fg: 'FF0369A1' },
};

const STATUS_LABELS: Record<string, string> = {
  open:        'Abierta',
  in_progress: 'En progreso',
  closed:      'Cerrada',
  verified:    'Verificada',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  open:        { bg: 'FFFEE2E2', fg: 'FF991B1B' },
  in_progress: { bg: 'FFFFF7ED', fg: 'FFB45309' },
  closed:      { bg: 'FFF0FDF4', fg: 'FF166534' },
  verified:    { bg: 'FFF0F9FF', fg: 'FF0369A1' },
};

// ── Type ─────────────────────────────────────────────────────────────────────

interface NCRow {
  code: string | null;
  title: string | null;
  nc_type: string | null;
  status: string | null;
  source: string | null;
  detected_at: string | null;
  closure_deadline: string | null;
  closed_at: string | null;
  root_cause: string | null;
  root_cause_method: string | null;
  notes: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | null | undefined): string {
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
    .from('nonconformities')
    .select(
      'code, title, nc_type, status, source,' +
      'detected_at, closure_deadline, closed_at,' +
      'root_cause, root_cause_method,' +
      'notes, created_at',
    )
    .eq('organization_id', orgId)
    .order('detected_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ncs = (data ?? []) as unknown as NCRow[];

  // ── Build workbook ──────────────────────────────────────────────────────────

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BC Compliance';
  wb.created = new Date();

  const ws = wb.addWorksheet('No Conformidades', {
    properties: { defaultColWidth: 18 },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  const HEADERS = [
    'Código', 'Título', 'Tipo', 'Estado', 'Fuente',
    'Detectado', 'Fecha Límite Cierre', 'Cerrado',
    'Causa Raíz', 'Método Causa Raíz',
    'Notas', 'Fecha Creación',
  ];

  const COL_WIDTHS = [
    12, 32, 14, 14, 18,
    16, 20, 16,
    35, 22,
    35, 16,
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
  ncs.forEach((nc, idx) => {
    const row = ws.addRow([
      fmt(nc.code),
      fmt(nc.title),
      TYPE_LABELS[nc.nc_type ?? ''] ?? fmt(nc.nc_type),
      STATUS_LABELS[nc.status ?? ''] ?? fmt(nc.status),
      fmt(nc.source),
      fmtDate(nc.detected_at),
      fmtDate(nc.closure_deadline),
      fmtDate(nc.closed_at),
      fmt(nc.root_cause),
      fmt(nc.root_cause_method),
      fmt(nc.notes),
      fmtDate(nc.created_at),
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

    // Color-code "Tipo" (column 3)
    const typeKey = nc.nc_type ?? '';
    const typeColors = TYPE_COLORS[typeKey];
    if (typeColors) {
      const typeCell = row.getCell(3);
      typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: typeColors.bg } };
      typeCell.font = { size: 9, bold: true, color: { argb: typeColors.fg } };
    }

    // Color-code "Estado" (column 4)
    const statusKey = nc.status ?? '';
    const statusColors = STATUS_COLORS[statusKey];
    if (statusColors) {
      const statusCell = row.getCell(4);
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColors.bg } };
      statusCell.font = { size: 9, bold: true, color: { argb: statusColors.fg } };
    }
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'L1' };

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="no-conformidades-${date}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
