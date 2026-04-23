'use server';

import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { getUserOrgId } from '@/shared/lib/actions-helpers';
import { writeAuditLog } from '@/shared/lib/audit';

export interface ImportResult {
  ok: boolean;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: Array<{ row: number; code?: string; message: string }>;
  error?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Cell parsers
// ────────────────────────────────────────────────────────────────────────────

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value && value.result !== undefined) return cellToString(value.result as ExcelJS.CellValue);
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((r) => r.text).join('').trim();
    }
  }
  return String(value).trim();
}

function parseSiNo(value: ExcelJS.CellValue): boolean | null {
  const s = cellToString(value).toUpperCase();
  if (!s || s === '-' || s === 'N/A' || s === 'NA') return null;
  if (s === 'SI' || s === 'SÍ' || s === 'YES' || s === 'TRUE' || s === '1' || s === 'X') return true;
  if (s === 'NO' || s === 'FALSE' || s === '0') return false;
  return null;
}

function parseDate(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const s = cellToString(value);
  if (!s || s === '-') return null;
  // Try common Colombian date formats: DD/MM/YYYY, DD-MM-YYYY
  const ddmm = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (ddmm) {
    const [, d, m, y] = ddmm;
    const year = y.length === 2 ? `20${y}` : y;
    const iso = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (!isNaN(new Date(iso).getTime())) return iso;
  }
  // Try ISO
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function parseInt15(value: ExcelJS.CellValue, fallback = 1): number {
  const s = cellToString(value);
  const n = parseInt(s, 10);
  if (isNaN(n) || n < 1) return fallback;
  if (n > 5) return 5;
  return n;
}

/** Maps a free-text cell value to an enum value via a normalization map. */
function parseEnum(
  value: ExcelJS.CellValue,
  map: Record<string, string>,
  fallback: string | null = null,
): string | null {
  const raw = cellToString(value)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[áä]/g, 'a')
    .replace(/[éë]/g, 'e')
    .replace(/[íï]/g, 'i')
    .replace(/[óö]/g, 'o')
    .replace(/[úü]/g, 'u');
  if (!raw || raw === '-') return fallback;
  if (raw in map) return map[raw];
  const values = Object.values(map);
  if (values.includes(raw)) return raw;
  return fallback;
}

const PROCESS_TYPE_MAP: Record<string, 'estrategico' | 'misional' | 'apoyo' | 'seguimiento_control'> = {
  estrategico: 'estrategico',
  misional: 'misional',
  apoyo: 'apoyo',
  seguimiento_control: 'seguimiento_control',
  seguimiento_y_control: 'seguimiento_control',
  evaluacion_y_control: 'seguimiento_control',
};

const ASSET_TYPE_MAP: Record<string, string> = {
  hardware: 'hardware',
  software: 'software',
  network: 'network',
  red: 'network',
  data: 'data',
  datos: 'data',
  informacion: 'data',
  personnel: 'personnel',
  personal: 'personnel',
  facility: 'facility',
  instalacion: 'facility',
  service: 'service',
  servicio: 'service',
  intangible: 'intangible',
  cloud_resource: 'cloud_resource',
  nube: 'cloud_resource',
  iot_device: 'iot_device',
  iot: 'iot_device',
};

const SUPPORT_MAP: Record<string, string> = {
  fisico: 'fisico',
  electronico: 'electronico',
  digital: 'digital',
  'fisico_/_electronico': 'fisico_electronico',
  fisico_electronico: 'fisico_electronico',
  'fisico_/_digital': 'fisico_digital',
  fisico_digital: 'fisico_digital',
  'electronico_/_digital': 'electronico_digital',
  electronico_digital: 'electronico_digital',
  'fisico_/_electronico_/_digital': 'fisico_electronico_digital',
  fisico_electronico_digital: 'fisico_electronico_digital',
  na: 'na',
  'n/a': 'na',
};

const LANGUAGE_MAP: Record<string, string> = {
  espanol: 'espanol',
  español: 'espanol',
  ingles: 'ingles',
  english: 'ingles',
  otro: 'otro',
};

const UPDATE_FREQ_MAP: Record<string, string> = {
  diaria: 'diaria',
  semanal: 'semanal',
  quincenal: 'quincenal',
  mensual: 'mensual',
  trimestral: 'trimestral',
  semestral: 'semestral',
  anual: 'anual',
  segun_requerimiento: 'segun_requerimiento',
};

const CIA_LEVEL_MAP: Record<string, string> = {
  alto: 'alto',
  medio: 'medio',
  bajo: 'bajo',
  high: 'alto',
  medium: 'medio',
  low: 'bajo',
};

const PERSONAL_DATA_TYPE_MAP: Record<string, string> = {
  publico: 'publico',
  privado: 'privado',
  semiprivado: 'semiprivado',
  sensible: 'sensible',
  na: 'na',
  'n/a': 'na',
};

// ────────────────────────────────────────────────────────────────────────────
// Main import action
// ────────────────────────────────────────────────────────────────────────────

export async function importAssets(formData: FormData): Promise<ImportResult> {
  try {
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return { ok: false, error: 'Archivo no recibido' };
    }
    if (file.size === 0) {
      return { ok: false, error: 'El archivo está vacío' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: 'El archivo excede 10MB' };
    }

    const orgId = await getUserOrgId();
    if (!orgId) return { ok: false, error: 'Sin organización activa' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'No autenticado' };

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) return { ok: false, error: 'El archivo no contiene hojas válidas' };

    // The exported template has 4 header rows (title + org info + sections + columns).
    // Detect by checking row 4 col 2 == "Codigo"; otherwise assume row 1 is header.
    let headerRowIdx = 4;
    const probe = cellToString(sheet.getRow(4).getCell(2).value).toLowerCase();
    if (probe !== 'codigo' && probe !== 'código') {
      headerRowIdx = 1;
    }
    const dataStartRow = headerRowIdx + 1;

    const errors: ImportResult['errors'] = [];
    const records: Array<Record<string, unknown>> = [];

    for (let r = dataStartRow; r <= sheet.actualRowCount; r++) {
      const row = sheet.getRow(r);

      const code = cellToString(row.getCell(2).value);
      const name = cellToString(row.getCell(8).value);

      // Skip totally blank rows
      if (!code && !name) continue;

      if (!code) {
        errors.push({ row: r, message: 'Falta código (columna B)' });
        continue;
      }
      if (!name) {
        errors.push({ row: r, code, message: 'Falta nombre (columna H)' });
        continue;
      }

      const record: Record<string, unknown> = {
        organization_id: orgId,
        code,
        name,
        // Section 1: Identification
        process_type: parseEnum(row.getCell(3).value, PROCESS_TYPE_MAP),
        process_name: cellToString(row.getCell(4).value) || null,
        sede: cellToString(row.getCell(5).value) || null,
        asset_id_custom: cellToString(row.getCell(6).value) || null,
        trd_serie: cellToString(row.getCell(7).value) || null,
        asset_type: parseEnum(row.getCell(9).value, ASSET_TYPE_MAP, 'data') ?? 'data',
        description: cellToString(row.getCell(10).value) || null,
        info_generation_date: parseDate(row.getCell(11).value),
        entry_date: parseDate(row.getCell(12).value),
        exit_date: parseDate(row.getCell(13).value),
        language: parseEnum(row.getCell(14).value, LANGUAGE_MAP, 'espanol') ?? 'espanol',
        format: cellToString(row.getCell(15).value) || null,
        // Section 1.2: Location
        support: parseEnum(row.getCell(16).value, SUPPORT_MAP, 'na') ?? 'na',
        consultation_place: cellToString(row.getCell(17).value) || null,
        // Section 1.3: Ownership
        info_owner: cellToString(row.getCell(18).value) || null,
        info_custodian: cellToString(row.getCell(19).value) || null,
        update_frequency: parseEnum(row.getCell(20).value, UPDATE_FREQ_MAP),
        // Section 2: ICC
        icc_social_impact: parseSiNo(row.getCell(21).value) ?? false,
        icc_economic_impact: parseSiNo(row.getCell(22).value) ?? false,
        icc_environmental_impact: parseSiNo(row.getCell(23).value) ?? false,
        icc_is_critical: parseSiNo(row.getCell(24).value) ?? false,
        // Section 3: CIA — qualitative + numeric (cols 25-30; 31 total + 32 criticality_cid are GENERATED, skip)
        confidentiality: parseEnum(row.getCell(25).value, CIA_LEVEL_MAP),
        integrity: parseEnum(row.getCell(26).value, CIA_LEVEL_MAP),
        availability: parseEnum(row.getCell(27).value, CIA_LEVEL_MAP),
        confidentiality_value: parseInt15(row.getCell(28).value),
        integrity_value: parseInt15(row.getCell(29).value),
        availability_value: parseInt15(row.getCell(30).value),
        // Section 4: Classified info
        exception_objective: cellToString(row.getCell(33).value) || null,
        constitutional_basis: cellToString(row.getCell(34).value) || null,
        legal_exception_basis: cellToString(row.getCell(35).value) || null,
        exception_scope: cellToString(row.getCell(36).value) || null,
        classification_date: parseDate(row.getCell(37).value),
        classification_term: cellToString(row.getCell(38).value) || null,
        // Section 5: Personal data
        contains_personal_data: parseSiNo(row.getCell(39).value) ?? false,
        contains_minors_data: parseSiNo(row.getCell(40).value) ?? false,
        personal_data_type: parseEnum(row.getCell(41).value, PERSONAL_DATA_TYPE_MAP, 'na') ?? 'na',
        personal_data_purpose: cellToString(row.getCell(42).value) || null,
        has_data_authorization: parseSiNo(row.getCell(43).value),
        // Defaults
        status: 'active',
        criticality: 'medium',
        updated_by: user.id,
      };

      records.push(record);
    }

    if (records.length === 0 && errors.length === 0) {
      return { ok: false, error: 'No se encontraron filas con datos en el archivo' };
    }

    // Detect existing codes to count inserted vs updated accurately
    const incomingCodes = records.map((r) => r.code as string);
    const { data: existingRows } = await supabase
      .from('assets')
      .select('code')
      .eq('organization_id', orgId)
      .in('code', incomingCodes);
    const existingSet = new Set((existingRows ?? []).map((r) => r.code));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // For inserts, also stamp created_by
    for (const rec of records) {
      const isUpdate = existingSet.has(rec.code as string);
      if (!isUpdate) rec.created_by = user.id;

      const { error } = await supabase
        .from('assets')
        .upsert(rec, { onConflict: 'organization_id,code' });

      if (error) {
        skipped++;
        errors.push({
          row: 0,
          code: rec.code as string,
          message: error.message,
        });
      } else {
        if (isUpdate) updated++;
        else inserted++;
      }
    }

    await writeAuditLog({
      action: 'create',
      tableName: 'assets',
      description: `Importación masiva: ${inserted} nuevos, ${updated} actualizados, ${skipped} con error`,
    });

    revalidatePath('/assets');

    return { ok: true, inserted, updated, skipped, errors: errors.length ? errors : undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al importar';
    console.error('[importAssets]', err);
    return { ok: false, error: msg };
  }
}
