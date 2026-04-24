import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ── Label maps ───────────────────────────────────────────────────────────────

const RISK_LEVEL_LABELS: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const RISK_LEVEL_COLORS: Record<string, { bg: string; fg: string }> = {
  critical: { bg: 'FFFEE2E2', fg: 'FF991B1B' },
  high:     { bg: 'FFFFF7ED', fg: 'FFB45309' },
  medium:   { bg: 'FFFEFCE8', fg: 'FFA16207' },
  low:      { bg: 'FFF0FDF4', fg: 'FF166534' },
};

// ── Type ─────────────────────────────────────────────────────────────────────

interface VendorRow {
  code: string | null;
  name: string | null;
  vendor_type: string | null;
  status: string | null;
  risk_level: string | null;
  risk_score: number | null;
  country: string | null;
  tax_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  processes_pii: boolean | null;
  processes_financial: boolean | null;
  has_iso27001: boolean | null;
  has_soc2: boolean | null;
  has_pentest: boolean | null;
  has_dpa: boolean | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_value: number | null;
  last_assessment_date: string | null;
  next_assessment_date: string | null;
  notes: string | null;
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
    .from('vendors')
    .select(
      'code, name, vendor_type, status, risk_level, risk_score, country, tax_id,' +
      'contact_name, contact_email, contact_phone, website,' +
      'processes_pii, processes_financial,' +
      'has_iso27001, has_soc2, has_pentest, has_dpa,' +
      'contract_start, contract_end, contract_value,' +
      'last_assessment_date, next_assessment_date,' +
      'notes, created_at',
    )
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const vendors = (data ?? []) as unknown as VendorRow[];

  // ── Build workbook ──────────────────────────────────────────────────────────

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BC Compliance';
  wb.created = new Date();

  const ws = wb.addWorksheet('Proveedores', {
    properties: { defaultColWidth: 18 },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  const HEADERS = [
    'Código', 'Nombre', 'Tipo', 'Estado', 'Nivel de Riesgo', 'Score', 'País', 'NIT/Tax ID',
    'Contacto', 'Email', 'Teléfono', 'Sitio Web',
    'Procesa PII', 'Procesa Financiero',
    'ISO 27001', 'SOC 2', 'Pentest', 'DPA',
    'Inicio Contrato', 'Fin Contrato', 'Valor Contrato',
    'Última Evaluación', 'Próxima Evaluación',
    'Notas', 'Fecha Creación',
  ];

  const COL_WIDTHS = [
    12, 30, 16, 14, 16, 8, 14, 16,
    22, 28, 14, 22,
    14, 16,
    12, 8, 10, 8,
    16, 16, 16,
    18, 18,
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

  // Column widths
  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Data rows
  vendors.forEach((v, idx) => {
    const row = ws.addRow([
      fmt(v.code),
      fmt(v.name),
      fmt(v.vendor_type),
      fmt(v.status),
      RISK_LEVEL_LABELS[v.risk_level ?? ''] ?? fmt(v.risk_level),
      v.risk_score != null ? v.risk_score : '',
      fmt(v.country),
      fmt(v.tax_id),
      fmt(v.contact_name),
      fmt(v.contact_email),
      fmt(v.contact_phone),
      fmt(v.website),
      boolLabel(v.processes_pii),
      boolLabel(v.processes_financial),
      boolLabel(v.has_iso27001),
      boolLabel(v.has_soc2),
      boolLabel(v.has_pentest),
      boolLabel(v.has_dpa),
      fmtDate(v.contract_start),
      fmtDate(v.contract_end),
      v.contract_value != null ? v.contract_value : '',
      fmtDate(v.last_assessment_date),
      fmtDate(v.next_assessment_date),
      fmt(v.notes),
      fmtDate(v.created_at),
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

    // Color-code "Nivel de Riesgo" (column 5)
    const riskKey = v.risk_level ?? '';
    const colors = RISK_LEVEL_COLORS[riskKey];
    if (colors) {
      const riskCell = row.getCell(5);
      riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
      riskCell.font = { size: 9, bold: true, color: { argb: colors.fg } };
    }
  });

  // Freeze header row + autofilter
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: `Y1` };

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="proveedores-${date}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
