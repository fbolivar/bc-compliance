'use server';

/**
 * Treatment-plan importer for the DAFP xlsx.
 *
 * Reads the same "Riesgos Seg Informacion" sheet we already ingested,
 * groups rows by "Número del Riesgo", and creates ONE treatment_plan per
 * risk with:
 *   - code         = TP-<riskCode>
 *   - title        = first non-empty action plan text (truncated)
 *   - description  = concatenated distinct action plans for that risk
 *   - start_date   = earliest Fecha de Inicio found across rows
 *   - target_date  = latest Fecha Final found across rows
 *   - notes        = responsible + monitoring schedule
 *   - status       = 'in_progress'
 * and links it to the risk via treatment_plan_risks. For each control
 * row with a distinct plan text, a treatment_plan_action is created so
 * the audit trail keeps the per-control granularity the Excel had.
 *
 * Idempotent: skips plans whose code already exists in the org.
 */

import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { writeAuditLog } from '@/shared/lib/audit';

export interface TreatmentPlanImportResult {
  ok: boolean;
  plansInserted?: number;
  plansSkipped?: number;
  actionsInserted?: number;
  linksInserted?: number;
  errors?: Array<{ row: number; message: string }>;
  error?: string;
  diagnostic?: {
    sheetName: string;
    headerRow: number;
    rowsScanned: number;
    uniqueRiskNumbers: number;
    risksNotFound: number;
  };
}

// Local copies of the helpers we need (kept inline to avoid cross-action imports)
function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return '';
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('result' in v && v.result !== undefined && v.result !== null) {
      const r = v.result as unknown;
      if (r instanceof Date) return r.toISOString();
      if (typeof r === 'string' || typeof r === 'number' || typeof r === 'boolean') return String(r).trim();
    }
    if ('richText' in v && Array.isArray((v as { richText?: unknown }).richText)) {
      return (v as { richText: Array<{ text: string }> }).richText.map((r) => r.text).join('').trim();
    }
    if ('text' in v && typeof (v as { text?: unknown }).text === 'string') {
      return ((v as { text: string }).text).trim();
    }
  }
  try {
    const t = cell.text;
    return typeof t === 'string' ? t.trim() : '';
  } catch {
    return '';
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áä]/g, 'a').replace(/[éë]/g, 'e').replace(/[íï]/g, 'i')
    .replace(/[óö]/g, 'o').replace(/[úü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_');
}

function parseDate(s: string): string | null {
  if (!s || s === '-') return null;
  const ddmm = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (ddmm) {
    const [, d, m, y] = ddmm;
    const year = y.length === 2 ? `20${y}` : y;
    const iso = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (!isNaN(new Date(iso).getTime())) return iso;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

interface ColumnMap { [field: string]: number }

const FIELD_ALIASES: Record<string, string[]> = {
  risk_number: ['numero_del_riesgo', 'no_riesgo', 'numero'],
  action_plan: ['plan_de_accion', 'plan_accion'],
  action_start: ['fecha_de_inicio', 'fecha_inicio'],
  action_end: ['fecha_final', 'fecha_fin'],
  action_monitoring: ['fecha_de_seguimiento', 'fecha_seguimiento'],
  responsible: ['responsable'],
};

function detectHeaders(sheet: ExcelJS.Worksheet): { headerRow: number; columnMap: ColumnMap } | null {
  const maxScan = Math.min(15, sheet.rowCount || 15);
  let best: { headerRow: number; columnMap: ColumnMap; matchCount: number } | null = null;

  for (let r = 1; r <= maxScan; r++) {
    const row = sheet.getRow(r);
    const headers: Array<{ col: number; normalized: string }> = [];
    const seen = new Set<string>();

    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const raw = cellText(cell);
      if (!raw || raw.endsWith(':')) return;
      const n = normalize(raw);
      if (!n || seen.has(n)) return;
      seen.add(n);
      headers.push({ col, normalized: n });
    });

    if (headers.length < 5) continue;

    const columnMap: ColumnMap = {};
    for (const h of headers) {
      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (columnMap[field]) continue;
        if (aliases.includes(h.normalized)) {
          columnMap[field] = h.col;
          break;
        }
      }
    }

    const matchCount = Object.keys(columnMap).length;
    if (matchCount >= 3 && columnMap.risk_number && columnMap.action_plan) {
      if (!best || matchCount > best.matchCount) {
        best = { headerRow: r, columnMap, matchCount };
      }
    }
  }

  return best ? { headerRow: best.headerRow, columnMap: best.columnMap } : null;
}

function readCell(row: ExcelJS.Row, columnMap: ColumnMap, field: string): string {
  const col = columnMap[field];
  if (!col) return '';
  return cellText(row.getCell(col));
}

export async function importTreatmentPlans(formData: FormData): Promise<TreatmentPlanImportResult> {
  try {
    const file = formData.get('file');
    if (!(file instanceof File)) return { ok: false, error: 'Archivo no recibido' };
    if (file.size === 0) return { ok: false, error: 'El archivo está vacío' };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'El archivo excede 10MB' };

    const { user, orgId } = await getCurrentOrg();
    if (!user) return { ok: false, error: 'No autenticado' };
    if (!orgId) return { ok: false, error: 'Sin organización activa' };

    const supabase = await createClient();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    let sheet: ExcelJS.Worksheet | undefined;
    for (const s of workbook.worksheets) {
      if (/riesgo/i.test(s.name)) { sheet = s; break; }
    }
    if (!sheet) sheet = workbook.worksheets.find((s) => s.columnCount >= 20);
    if (!sheet) return { ok: false, error: 'No se encontró una hoja de riesgos en el archivo' };

    const detected = detectHeaders(sheet);
    if (!detected) {
      return {
        ok: false,
        error: 'No se detectaron las columnas necesarias (Número del Riesgo, Plan de Acción, fechas).',
      };
    }

    const { headerRow, columnMap } = detected;

    // Pre-fetch risks by code to map R-001 → id
    const { data: risks } = await supabase
      .from('risk_scenarios')
      .select('id, code')
      .eq('organization_id', orgId);
    const riskByCode = new Map<string, string>();
    for (const r of (risks ?? []) as Array<{ id: string; code: string }>) {
      riskByCode.set(r.code, r.id);
    }

    // Pre-fetch existing plans to skip duplicates
    const { data: existing } = await supabase
      .from('treatment_plans')
      .select('code')
      .eq('organization_id', orgId);
    const existingCodes = new Set((existing ?? []).map((p) => p.code));

    // Group rows by riskNumber and collect plan info
    interface PlanRow {
      rowIdx: number;
      riskNumber: string;
      actionPlan: string;
      actionStart: string;
      actionEnd: string;
      actionMonitoring: string;
      responsible: string;
    }
    const rows: PlanRow[] = [];
    let rowsScanned = 0;
    const lastRow = Math.max(sheet.rowCount, sheet.actualRowCount);
    for (let r = headerRow + 1; r <= lastRow; r++) {
      const row = sheet.getRow(r);
      rowsScanned++;
      const riskNumber = readCell(row, columnMap, 'risk_number');
      const actionPlan = readCell(row, columnMap, 'action_plan');
      if (!riskNumber && !actionPlan) continue;
      rows.push({
        rowIdx: r,
        riskNumber,
        actionPlan,
        actionStart: readCell(row, columnMap, 'action_start'),
        actionEnd: readCell(row, columnMap, 'action_end'),
        actionMonitoring: readCell(row, columnMap, 'action_monitoring'),
        responsible: readCell(row, columnMap, 'responsible'),
      });
    }

    // Forward-fill risk number across rows (merged cells in Excel)
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].riskNumber && rows[i - 1].riskNumber) {
        rows[i].riskNumber = rows[i - 1].riskNumber;
      }
    }

    // Group by riskNumber, keep only rows with non-empty actionPlan
    const byRisk = new Map<string, PlanRow[]>();
    for (const r of rows) {
      if (!r.riskNumber || !r.actionPlan) continue;
      if (!byRisk.has(r.riskNumber)) byRisk.set(r.riskNumber, []);
      byRisk.get(r.riskNumber)!.push(r);
    }

    const errors: TreatmentPlanImportResult['errors'] = [];
    let plansInserted = 0;
    let plansSkipped = 0;
    let actionsInserted = 0;
    let linksInserted = 0;
    let risksNotFound = 0;

    for (const [riskNumber, group] of byRisk) {
      const riskCode = `R-${String(riskNumber).padStart(3, '0')}`;
      const planCode = `TP-${riskCode}`;

      if (existingCodes.has(planCode)) {
        plansSkipped++;
        continue;
      }

      const riskId = riskByCode.get(riskCode);
      if (!riskId) {
        risksNotFound++;
        errors.push({
          row: group[0].rowIdx,
          message: `Riesgo ${riskCode} no existe (impórtalo primero con la matriz DAFP)`,
        });
        continue;
      }

      // Build plan from the group
      const distinctActions = Array.from(new Set(group.map((g) => g.actionPlan).filter(Boolean)));
      const title = distinctActions[0].slice(0, 200);
      const description = distinctActions.join('\n\n');

      const startDates = group.map((g) => parseDate(g.actionStart)).filter((d): d is string => !!d);
      const endDates = group.map((g) => parseDate(g.actionEnd)).filter((d): d is string => !!d);
      const start_date = startDates.length ? startDates.sort()[0] : null;
      const target_date = endDates.length ? endDates.sort().slice(-1)[0] : null;

      const responsibles = Array.from(new Set(group.map((g) => g.responsible).filter(Boolean)));
      const monitorings = Array.from(new Set(group.map((g) => g.actionMonitoring).filter(Boolean)));
      const notes = [
        responsibles.length ? `Responsable(s): ${responsibles.join(' · ')}` : null,
        monitorings.length ? `Seguimiento: ${monitorings.join(' · ')}` : null,
      ].filter(Boolean).join('\n');

      const { data: insertedPlan, error: planErr } = await supabase
        .from('treatment_plans')
        .insert({
          organization_id: orgId,
          code: planCode,
          title,
          description,
          status: 'in_progress',
          start_date,
          target_date,
          notes: notes || null,
          created_by: user.id,
          updated_by: user.id,
        })
        .select('id, code')
        .single();

      if (planErr || !insertedPlan) {
        errors.push({
          row: group[0].rowIdx,
          message: `No se pudo crear el plan ${planCode}: ${planErr?.message ?? 'error'}`,
        });
        continue;
      }
      plansInserted++;
      existingCodes.add(planCode);

      // Link plan → risk
      const { error: linkErr } = await supabase
        .from('treatment_plan_risks')
        .insert({
          treatment_plan_id: insertedPlan.id,
          risk_scenario_id: riskId,
        });
      if (!linkErr) linksInserted++;

      // One action per distinct action plan text, in order
      for (let i = 0; i < distinctActions.length; i++) {
        const actionText = distinctActions[i];
        const sourceRow = group.find((g) => g.actionPlan === actionText);
        const { error: actErr } = await supabase
          .from('treatment_plan_actions')
          .insert({
            organization_id: orgId,
            treatment_plan_id: insertedPlan.id,
            title: actionText.slice(0, 200),
            description: actionText,
            due_date: sourceRow ? parseDate(sourceRow.actionEnd) : null,
            status: 'pending',
            sort_order: i,
            evidence_required: true,
            notes: sourceRow?.actionMonitoring || null,
          });
        if (!actErr) actionsInserted++;
      }
    }

    await writeAuditLog({
      action: 'create',
      tableName: 'treatment_plans',
      description: `Importación de planes de tratamiento: ${plansInserted} nuevos, ${plansSkipped} duplicados, ${actionsInserted} acciones`,
    });

    revalidatePath('/risks');
    revalidatePath('/risks/treatment-plans');

    return {
      ok: true,
      plansInserted,
      plansSkipped,
      actionsInserted,
      linksInserted,
      errors: errors.length ? errors : undefined,
      diagnostic: {
        sheetName: sheet.name,
        headerRow,
        rowsScanned,
        uniqueRiskNumbers: byRisk.size,
        risksNotFound,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al importar planes';
    console.error('[importTreatmentPlans]', err);
    return { ok: false, error: msg };
  }
}
