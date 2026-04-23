'use server';

/**
 * DAFP risk matrix importer (hybrid DAFP 2020 + MAGERIT).
 *
 * Reads an xlsx file whose "Riesgos" sheet follows the Colombian DAFP 2020
 * format (Decreto 2106/2019 + MIPG). The sheet groups rows by "Número del
 * Riesgo" — a single risk can have N controls, each on its own row, with
 * the risk columns (A-P) repeated. We dedupe by Número del Riesgo, create
 * one risk_scenario per unique risk, and one control + control_risk_mapping
 * per control row. Skip-if-exists on the risk code + control code.
 */

import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { writeAuditLog } from '@/shared/lib/audit';

export interface RiskImportResult {
  ok: boolean;
  risksInserted?: number;
  risksSkipped?: number;
  controlsInserted?: number;
  mappingsInserted?: number;
  rejected?: number;
  errors?: Array<{ row: number; message: string; code?: string }>;
  error?: string;
  diagnostic?: {
    sheetName: string;
    headerRow: number;
    rowsScanned: number;
    uniqueRiskNumbers: number;
    processMatched: number;
    processFallback: number;
    threatCreated: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Cell helpers (shared approach with assets importer)
// ────────────────────────────────────────────────────────────────────────────

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

function normalizeProcessName(s: string): string {
  const stripped = s.replace(/^\s*[A-Z]+\d+\s*[·•–\-]\s*/, '');
  return normalize(stripped);
}

/** Spanish stopwords that commonly add/disappear in process names ("Gestión de Tecnologías" vs "Gestión Tecnologias"). */
const STOPWORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'u', 'e', 'a', 'en', 'para', 'por', 'con',
  'al', 'un', 'una', 'unos', 'unas',
]);

/** Normalizes a process name into a Set of significant tokens (no stopwords). */
function processNameTokens(s: string): Set<string> {
  const normalized = normalizeProcessName(s);
  return new Set(
    normalized
      .split('_')
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  );
}

/**
 * Tolerant matcher: returns true if seed tokens and input tokens share
 * at least 70% of their significant tokens (Jaccard-like). Handles
 * typos like missing "de", missing accents, minor word reorder.
 */
function processTokensMatch(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const tok of a) if (b.has(tok)) shared++;
  const smaller = Math.min(a.size, b.size);
  return shared / smaller;
}

// ────────────────────────────────────────────────────────────────────────────
// DAFP value mappings
// ────────────────────────────────────────────────────────────────────────────

/** DAFP 5-point probability: normalized label → { label, value } */
const PROBABILITY_MAP: Record<string, { label: string; value: number }> = {
  muy_baja: { label: 'Muy Baja', value: 0.2 },
  baja: { label: 'Baja', value: 0.4 },
  media: { label: 'Media', value: 0.6 },
  alta: { label: 'Alta', value: 0.8 },
  muy_alta: { label: 'Muy Alta', value: 1.0 },
};

/** DAFP 5-point impact: normalized label → { label, value } */
const IMPACT_MAP: Record<string, { label: string; value: number }> = {
  leve: { label: 'Leve', value: 0.2 },
  menor: { label: 'Menor', value: 0.4 },
  moderado: { label: 'Moderado', value: 0.6 },
  mayor: { label: 'Mayor', value: 0.8 },
  catastrofico: { label: 'Catastrófico', value: 1.0 },
};

/** DAFP treatment labels → internal enum */
const TREATMENT_MAP: Record<string, string> = {
  reducir: 'mitigate',
  reducir_mitigacion: 'mitigate',
  mitigar: 'mitigate',
  mitigacion: 'mitigate',
  aceptar: 'accept',
  aceptacion: 'accept',
  evitar: 'avoid',
  transferir: 'transfer',
  compartir: 'share',
};

/** DAFP control type → internal enum */
const CONTROL_TYPE_MAP: Record<string, string> = {
  preventivo: 'preventive',
  detectivo: 'detective',
  correctivo: 'corrective',
  disuasivo: 'deterrent',
  compensatorio: 'compensating',
  recuperacion: 'recovery',
};

/** DAFP automation level → internal enum */
const AUTOMATION_MAP: Record<string, string> = {
  manual: 'manual',
  automatizado: 'fully_automated',
  automatico: 'fully_automated',
  semi_automatizado: 'semi_automated',
  semiautomatizado: 'semi_automated',
  semi_automatico: 'semi_automated',
};

/**
 * DAFP 5×5 matrix for inherent risk zone.
 * Returns one of: 'Bajo', 'Moderado', 'Alto', 'Extremo'.
 */
function computeRiskZone(probValue: number, impValue: number): string {
  const score = probValue * impValue;
  if (score >= 0.6) return 'Extremo';
  if (score >= 0.3) return 'Alto';
  if (score >= 0.12) return 'Moderado';
  return 'Bajo';
}

/** Map DAFP zone → our internal risk_level enum. */
function zoneToLevel(zone: string | null): 'critical' | 'high' | 'medium' | 'low' | 'negligible' {
  switch (zone) {
    case 'Extremo': return 'critical';
    case 'Alto': return 'high';
    case 'Moderado': return 'medium';
    case 'Bajo': return 'low';
    default: return 'medium';
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Column map for the DAFP risk sheet
// ────────────────────────────────────────────────────────────────────────────

const FIELD_ALIASES: Record<string, string[]> = {
  risk_number: ['numero_del_riesgo', 'no_riesgo', 'numero'],
  process_name: ['proceso'],
  risk_name: ['riesgo'],
  asset_generic: ['activo'],
  description: ['descripcion_del_riesgo', 'descripcion'],
  threat: ['amenaza', 'amenazas'],
  risk_type: ['tipo'],
  causes: ['causas_vulnerabilidades', 'causas', 'vulnerabilidades'],
  consequences: ['consecuencias'],
  activity_frequency: ['frecuencia_con_la_que_se_realiza_la_actividad', 'frecuencia_actividad'],
  probability_label: ['probabilidad_inherente', 'probabilidad'],
  impact_criteria: ['criterios_de_impacto', 'criterios_impacto'],
  impact_label: ['impacto_inherente', 'impacto'],
  risk_zone_inherent: ['zona_de_riesgo_inherente', 'zona_de_riesgo'],
  control_number: ['no_control', 'numero_control'],
  control_activity: ['actividad_de_control', 'actividad_control'],
  control_affects: ['afectacion_del_control', 'afectacion'],
  control_type: ['tipo_de_control', 'tipo_control'],
  control_implementation: ['implementacion'],
  control_documentation: ['documentacion'],
  control_evidence: ['evidencia'],
  control_frequency: ['frecuencia'],
  treatment: ['tratamiento'],
  treatment_comment: ['comentario_del_tratamiento', 'comentario_tratamiento'],
  action_plan: ['plan_de_accion', 'plan_accion'],
  action_start: ['fecha_de_inicio', 'fecha_inicio'],
  action_end: ['fecha_final', 'fecha_fin'],
  action_monitoring: ['fecha_de_seguimiento', 'fecha_seguimiento'],
  responsible: ['responsable'],
};

interface ColumnMap { [field: string]: number }

const MIN_HEADER_MATCHES = 8;

function detectHeaders(sheet: ExcelJS.Worksheet): {
  headerRow: number;
  columnMap: ColumnMap;
} | null {
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

    if (headers.length < MIN_HEADER_MATCHES) continue;

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
    if (matchCount >= MIN_HEADER_MATCHES && columnMap.risk_number && columnMap.risk_name) {
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

function parseIntSafe(s: string): number | null {
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
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

function parseEnum(s: string, map: Record<string, string>): string | null {
  if (!s) return null;
  const n = normalize(s);
  if (n in map) return map[n];
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Main importer
// ────────────────────────────────────────────────────────────────────────────

interface ThreatRow { id: string; code: string; name: string }

export async function importRiskMatrix(formData: FormData): Promise<RiskImportResult> {
  try {
    const file = formData.get('file');
    if (!(file instanceof File)) return { ok: false, error: 'Archivo no recibido' };
    if (file.size === 0) return { ok: false, error: 'El archivo está vacío' };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'El archivo excede 10MB' };

    const fallbackProcessId = (formData.get('fallback_process_id') as string | null)?.trim() || null;

    const { user, orgId } = await getCurrentOrg();
    if (!user) return { ok: false, error: 'No autenticado' };
    if (!orgId) return { ok: false, error: 'Sin organización activa' };

    const supabase = await createClient();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Find the risk sheet — prefer explicit name match, otherwise first sheet with >= 20 cols
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
        error: 'No se detectó la cabecera de la matriz de riesgos. Verifica que tenga columnas como "Número del Riesgo", "Proceso", "Riesgo", "Amenaza".',
        diagnostic: {
          sheetName: sheet.name,
          headerRow: 0,
          rowsScanned: Math.min(15, sheet.rowCount || 15),
          uniqueRiskNumbers: 0,
          processMatched: 0,
          processFallback: 0,
          threatCreated: 0,
        },
      };
    }

    const { headerRow, columnMap } = detected;
    const dataStartRow = headerRow + 1;

    // Pre-build lookups
    const { data: processCats } = await supabase
      .from('asset_categories')
      .select('id, name')
      .eq('organization_id', orgId)
      .not('parent_id', 'is', null);

    // Exact match lookup + fuzzy (token-based) fallback
    const processByName = new Map<string, string>();
    const processTokens: Array<{ id: string; name: string; tokens: Set<string> }> = [];
    for (const c of (processCats ?? []) as Array<{ id: string; name: string }>) {
      processByName.set(normalizeProcessName(c.name), c.id);
      processTokens.push({ id: c.id, name: c.name, tokens: processNameTokens(c.name) });
    }

    function resolveProcess(rawName: string): string | null {
      if (!rawName) return null;
      // 1. Exact normalized match
      const exact = processByName.get(normalizeProcessName(rawName));
      if (exact) return exact;
      // 2. Fuzzy match by token overlap (best match ≥ 0.7)
      const inputTokens = processNameTokens(rawName);
      if (inputTokens.size === 0) return null;
      let bestId: string | null = null;
      let bestScore = 0.7; // threshold
      for (const p of processTokens) {
        const score = processTokensMatch(inputTokens, p.tokens);
        if (score > bestScore) {
          bestScore = score;
          bestId = p.id;
        }
      }
      return bestId;
    }

    const { data: threats } = await supabase
      .from('threat_catalog')
      .select('id, code, name');
    const threatByName = new Map<string, ThreatRow>();
    for (const t of (threats ?? []) as ThreatRow[]) {
      threatByName.set(normalize(t.name), t);
    }

    // Existing codes to skip
    const { data: existingRisks } = await supabase
      .from('risk_scenarios')
      .select('code')
      .eq('organization_id', orgId);
    const existingRiskCodes = new Set((existingRisks ?? []).map((r) => r.code));

    const { data: existingControls } = await supabase
      .from('controls')
      .select('code')
      .eq('organization_id', orgId);
    const existingControlCodes = new Set((existingControls ?? []).map((c) => c.code));

    // Parse rows — group by "Número del Riesgo"
    interface ParsedRow {
      rowIdx: number;
      riskNumber: string;
      riskName: string;
      processName: string;
      description: string;
      threat: string;
      riskType: string;
      causes: string;
      consequences: string;
      activityFreq: string;
      probabilityLabel: string;
      impactLabel: string;
      zoneInherent: string;
      // Per-control fields
      controlNumber: string;
      controlActivity: string;
      controlAffects: string;
      controlType: string;
      controlImpl: string;
      controlDoc: string;
      controlEvidence: string;
      controlFreq: string;
      treatment: string;
      treatmentComment: string;
      actionPlan: string;
      actionStart: string;
      actionEnd: string;
      actionMonitoring: string;
      responsible: string;
    }

    const rows: ParsedRow[] = [];
    const lastRow = Math.max(sheet.rowCount, sheet.actualRowCount);
    let rowsScanned = 0;
    for (let r = dataStartRow; r <= lastRow; r++) {
      const row = sheet.getRow(r);
      rowsScanned++;

      const riskNumber = readCell(row, columnMap, 'risk_number');
      const riskName = readCell(row, columnMap, 'risk_name');
      const controlActivity = readCell(row, columnMap, 'control_activity');
      if (!riskNumber && !riskName && !controlActivity) continue; // blank row

      rows.push({
        rowIdx: r,
        riskNumber,
        riskName,
        processName: readCell(row, columnMap, 'process_name'),
        description: readCell(row, columnMap, 'description'),
        threat: readCell(row, columnMap, 'threat'),
        riskType: readCell(row, columnMap, 'risk_type'),
        causes: readCell(row, columnMap, 'causes'),
        consequences: readCell(row, columnMap, 'consequences'),
        activityFreq: readCell(row, columnMap, 'activity_frequency'),
        probabilityLabel: readCell(row, columnMap, 'probability_label'),
        impactLabel: readCell(row, columnMap, 'impact_label'),
        zoneInherent: readCell(row, columnMap, 'risk_zone_inherent'),
        controlNumber: readCell(row, columnMap, 'control_number'),
        controlActivity,
        controlAffects: readCell(row, columnMap, 'control_affects'),
        controlType: readCell(row, columnMap, 'control_type'),
        controlImpl: readCell(row, columnMap, 'control_implementation'),
        controlDoc: readCell(row, columnMap, 'control_documentation'),
        controlEvidence: readCell(row, columnMap, 'control_evidence'),
        controlFreq: readCell(row, columnMap, 'control_frequency'),
        treatment: readCell(row, columnMap, 'treatment'),
        treatmentComment: readCell(row, columnMap, 'treatment_comment'),
        actionPlan: readCell(row, columnMap, 'action_plan'),
        actionStart: readCell(row, columnMap, 'action_start'),
        actionEnd: readCell(row, columnMap, 'action_end'),
        actionMonitoring: readCell(row, columnMap, 'action_monitoring'),
        responsible: readCell(row, columnMap, 'responsible'),
      });
    }

    // Forward-fill risk info (when Excel repeats via merged cells the risk info)
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const cur = rows[i];
      if (!cur.riskNumber && prev.riskNumber) cur.riskNumber = prev.riskNumber;
      if (cur.riskNumber && cur.riskNumber === prev.riskNumber) {
        if (!cur.riskName) cur.riskName = prev.riskName;
        if (!cur.processName) cur.processName = prev.processName;
        if (!cur.description) cur.description = prev.description;
        if (!cur.threat) cur.threat = prev.threat;
        if (!cur.riskType) cur.riskType = prev.riskType;
        if (!cur.causes) cur.causes = prev.causes;
        if (!cur.consequences) cur.consequences = prev.consequences;
        if (!cur.activityFreq) cur.activityFreq = prev.activityFreq;
        if (!cur.probabilityLabel) cur.probabilityLabel = prev.probabilityLabel;
        if (!cur.impactLabel) cur.impactLabel = prev.impactLabel;
        if (!cur.zoneInherent) cur.zoneInherent = prev.zoneInherent;
      }
    }

    // Group by risk number
    const byRiskNumber = new Map<string, ParsedRow[]>();
    for (const r of rows) {
      if (!r.riskNumber) continue;
      if (!byRiskNumber.has(r.riskNumber)) byRiskNumber.set(r.riskNumber, []);
      byRiskNumber.get(r.riskNumber)!.push(r);
    }

    const errors: RiskImportResult['errors'] = [];
    let risksInserted = 0;
    let risksSkipped = 0;
    let controlsInserted = 0;
    let mappingsInserted = 0;
    let processMatched = 0;
    let processFallback = 0;
    let threatCreated = 0;

    for (const [riskNumber, group] of byRiskNumber) {
      const first = group[0];
      const riskCode = `R-${String(riskNumber).padStart(3, '0')}`;

      if (existingRiskCodes.has(riskCode)) {
        risksSkipped++;
        continue;
      }

      // Resolve process: exact → fuzzy → fallback
      let categoryId: string | null = null;
      const matched = first.processName ? resolveProcess(first.processName) : null;
      if (matched) {
        categoryId = matched;
        processMatched++;
      } else if (fallbackProcessId) {
        categoryId = fallbackProcessId;
        processFallback++;
      }

      if (!categoryId) {
        errors.push({
          row: first.rowIdx,
          code: riskCode,
          message: `Proceso "${first.processName}" no coincide con ningún proceso sembrado (revisa nombre o sube desde la página de un proceso específico)`,
        });
        continue;
      }

      // Resolve threat (create if missing)
      let threatId: string | null = null;
      let threatError: string | null = null;
      if (first.threat) {
        const threatLookupKey = normalize(first.threat);
        let threat = threatByName.get(threatLookupKey);
        if (!threat) {
          // Create a new threat in catalog (org-scoped to keep MAGERIT base catalog clean).
          // Ensure code uniqueness by appending a short hash of the full name.
          const base = normalize(first.threat).slice(0, 14).toUpperCase();
          const shortHash = Math.abs(
            Array.from(first.threat).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
          ).toString(36).slice(0, 4).toUpperCase();
          const threatCode = `T-DAFP-${base}-${shortHash}`;
          const { data: newThreat, error: threatErr } = await supabase
            .from('threat_catalog')
            .insert({
              organization_id: orgId,
              code: threatCode,
              name: first.threat.slice(0, 200),
              origin: 'deliberate',
              affected_dimensions: ['confidentiality', 'integrity', 'availability'],
            })
            .select('id, code, name')
            .single();
          if (!threatErr && newThreat) {
            threat = newThreat as ThreatRow;
            threatByName.set(threatLookupKey, threat);
            threatCreated++;
          } else if (threatErr) {
            threatError = threatErr.message;
          }
        }
        threatId = threat?.id ?? null;
      }

      if (!threatId) {
        errors.push({
          row: first.rowIdx,
          code: riskCode,
          message: threatError
            ? `No se pudo crear la amenaza "${first.threat}": ${threatError}`
            : `No se pudo resolver la amenaza "${first.threat}"`,
        });
        continue;
      }

      // DAFP labels → internal values
      const prob = PROBABILITY_MAP[normalize(first.probabilityLabel)];
      const imp = IMPACT_MAP[normalize(first.impactLabel)];
      const probValue = prob?.value ?? 0.6;
      const impValue = imp?.value ?? 0.6;
      const zone = first.zoneInherent
        ? (normalize(first.zoneInherent) === 'extremo' ? 'Extremo'
          : normalize(first.zoneInherent) === 'alto' ? 'Alto'
          : normalize(first.zoneInherent) === 'moderado' ? 'Moderado'
          : 'Bajo')
        : computeRiskZone(probValue, impValue);

      // Treatment (take from first row with a treatment value)
      const treatmentRaw = group.find((g) => g.treatment)?.treatment ?? '';
      const treatment = parseEnum(treatmentRaw, TREATMENT_MAP) ?? 'mitigate';

      // MAGERIT frequency (0-5 scale): map from DAFP probability
      const mageritFreq = prob?.value === 1.0 ? 5 : prob?.value === 0.8 ? 4 : prob?.value === 0.6 ? 3 : prob?.value === 0.4 ? 2 : 1;
      // MAGERIT degradation: approximate from impact
      const degradation = Math.round((imp?.value ?? 0.6) * 100);

      const riskRecord: Record<string, unknown> = {
        organization_id: orgId,
        code: riskCode,
        name: first.riskName || `Riesgo ${riskNumber}`,
        description: first.description || null,
        asset_id: null,
        category_id: categoryId,
        threat_id: threatId,
        // DAFP fields
        causes: first.causes || null,
        consequences: first.consequences || null,
        risk_type: first.riskType || null,
        activity_frequency: parseIntSafe(first.activityFreq),
        probability_label: prob?.label ?? null,
        probability_value: probValue,
        impact_label: imp?.label ?? null,
        impact_value: impValue,
        risk_zone: zone,
        // MAGERIT-compatible fields
        frequency: mageritFreq,
        degradation_c: degradation,
        degradation_i: degradation,
        degradation_a: degradation,
        risk_level_inherent: zoneToLevel(zone),
        risk_level_residual: zoneToLevel(zone),  // initially same, will be recalculated with controls
        treatment,
        treatment_justification: group.find((g) => g.treatmentComment)?.treatmentComment || null,
        created_by: user.id,
        updated_by: user.id,
      };

      const { data: insertedRisk, error: riskErr } = await supabase
        .from('risk_scenarios')
        .insert(riskRecord)
        .select('id, code')
        .single();

      if (riskErr || !insertedRisk) {
        errors.push({
          row: first.rowIdx,
          code: riskCode,
          message: `No se pudo crear el riesgo: ${riskErr?.message ?? 'error desconocido'}`,
        });
        continue;
      }

      risksInserted++;
      existingRiskCodes.add(riskCode);

      // Create controls + mappings, one per control row
      for (const controlRow of group) {
        if (!controlRow.controlActivity) continue;

        const controlCode = `CTRL-${riskCode.replace(/^R-/, '')}-${controlRow.controlNumber || '?'}`;
        if (existingControlCodes.has(controlCode)) continue;

        const controlRecord: Record<string, unknown> = {
          organization_id: orgId,
          code: controlCode,
          name: controlRow.controlActivity.slice(0, 200),
          description: controlRow.controlActivity,
          control_type: parseEnum(controlRow.controlType, CONTROL_TYPE_MAP) ?? 'preventive',
          automation_level: parseEnum(controlRow.controlImpl, AUTOMATION_MAP) ?? 'manual',
          status: 'implemented',
          // DAFP attributes
          affects_probability_or_impact: normalize(controlRow.controlAffects) === 'probabilidad' ? 'Probabilidad'
            : normalize(controlRow.controlAffects) === 'impacto' ? 'Impacto' : null,
          is_documented: /docum/i.test(controlRow.controlDoc) && !/no\s+docum/i.test(controlRow.controlDoc),
          has_evidence: /registro/i.test(controlRow.controlEvidence) && !/sin\s+registro/i.test(controlRow.controlEvidence),
          control_frequency_dafp: controlRow.controlFreq || null,
          execution_frequency: controlRow.controlFreq || null,
          created_by: user.id,
          updated_by: user.id,
        };

        const { data: insertedControl, error: ctrlErr } = await supabase
          .from('controls')
          .insert(controlRecord)
          .select('id, code')
          .single();

        if (ctrlErr || !insertedControl) {
          errors.push({
            row: controlRow.rowIdx,
            code: controlCode,
            message: `No se pudo crear control: ${ctrlErr?.message ?? 'error'}`,
          });
          continue;
        }

        controlsInserted++;
        existingControlCodes.add(controlCode);

        // Link control to risk via pivot
        const { error: mapErr } = await supabase
          .from('control_risk_mappings')
          .insert({
            organization_id: orgId,
            control_id: insertedControl.id,
            risk_scenario_id: insertedRisk.id,
            effectiveness: 50, // neutral default
            notes: controlRow.treatmentComment || null,
          });

        if (!mapErr) mappingsInserted++;
      }
    }

    await writeAuditLog({
      action: 'create',
      tableName: 'risk_scenarios',
      description: `Importación matriz DAFP: ${risksInserted} riesgos nuevos, ${risksSkipped} duplicados, ${controlsInserted} controles, ${mappingsInserted} vínculos`,
    });

    revalidatePath('/risks');

    return {
      ok: true,
      risksInserted,
      risksSkipped,
      controlsInserted,
      mappingsInserted,
      rejected: errors.length,
      errors: errors.length ? errors : undefined,
      diagnostic: {
        sheetName: sheet.name,
        headerRow,
        rowsScanned,
        uniqueRiskNumbers: byRiskNumber.size,
        processMatched,
        processFallback,
        threatCreated,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al importar';
    console.error('[importRiskMatrix]', err);
    return { ok: false, error: msg };
  }
}
