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
  /** Diagnostic: which row the parser detected the header on, and which fields it found. */
  diagnostic?: {
    sheetName: string;
    headerRow: number;
    rowsScanned: number;
    columnsMapped: number;
    unmappedHeaders: string[];
    sampleHeaders: string[];
  };
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

/**
 * Maps a free-text cell value to an enum value via a normalization map.
 * Uses the same normalization as headers so map keys can be reused for both.
 */
function parseEnum(
  value: ExcelJS.CellValue,
  map: Record<string, string>,
  fallback: string | null = null,
): string | null {
  const text = cellToString(value);
  if (!text || text === '-') return fallback;
  const raw = normalizeHeader(text);
  if (!raw) return fallback;
  if (raw in map) return map[raw];
  const values = Object.values(map);
  if (values.includes(raw)) return raw;
  return fallback;
}

const PROCESS_TYPE_MAP: Record<string, 'estrategico' | 'misional' | 'apoyo' | 'seguimiento_control'> = {
  estrategico: 'estrategico',
  estrategicos: 'estrategico',
  estrategia: 'estrategico',
  misional: 'misional',
  misionales: 'misional',
  mision: 'misional',
  apoyo: 'apoyo',
  apoyos: 'apoyo',
  soporte: 'apoyo',
  seguimiento_control: 'seguimiento_control',
  seguimiento_y_control: 'seguimiento_control',
  evaluacion_y_control: 'seguimiento_control',
  evaluacion: 'seguimiento_control',
  control: 'seguimiento_control',
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
  fisico_electronico: 'fisico_electronico',
  fisico_digital: 'fisico_digital',
  electronico_digital: 'electronico_digital',
  fisico_electronico_digital: 'fisico_electronico_digital',
  na: 'na',
  n_a: 'na',
  no_aplica: 'na',
};

const LANGUAGE_MAP: Record<string, string> = {
  espanol: 'espanol',
  esp: 'espanol',
  ingles: 'ingles',
  ing: 'ingles',
  english: 'ingles',
  esp_ing: 'otro',
  espanol_ingles: 'otro',
  ingles_espanol: 'otro',
  bilingue: 'otro',
  otro: 'otro',
  otros: 'otro',
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
  dato_personal_publico: 'publico',
  dato_personal_privado: 'privado',
  dato_personal_semiprivado: 'semiprivado',
  dato_personal_sensible: 'sensible',
  datos_personales_publicos: 'publico',
  datos_personales_privados: 'privado',
  datos_personales_semiprivados: 'semiprivado',
  datos_personales_sensibles: 'sensible',
  na: 'na',
  n_a: 'na',
  no_aplica: 'na',
};

// ────────────────────────────────────────────────────────────────────────────
// Header → DB field mapping (multiple aliases per field for robustness)
// ────────────────────────────────────────────────────────────────────────────

function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áä]/g, 'a').replace(/[éë]/g, 'e').replace(/[íï]/g, 'i')
    .replace(/[óö]/g, 'o').replace(/[úü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, ' ')   // any non-alphanumeric (parens, dashes, ?, ¿, /, newlines) → space
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Each DB field can be matched by any of its alias headers.
 * Aliases must be already-normalized (via normalizeHeader): lowercase, accents stripped,
 * non-alphanumeric collapsed to underscores. We list both short BC Trust forms and
 * the long PNNC forms (Parques Nacionales formato oficial).
 */
const FIELD_ALIASES: Record<string, string[]> = {
  code: [
    'codigo', 'code', 'cod', 'codigo_activo', 'id_activo',
    'id_global_del_activo', 'id_global', 'identificador_global',
  ],
  process_type: [
    'tipo_de_proceso', 'tipo_proceso', 'process_type',
  ],
  process_name: [
    'proceso', 'nombre_del_proceso', 'process_name', 'nombre_proceso',
    'proceso_responsable_o_propietario_del_activo',
    'responsable_o_propietario_del_activo',
  ],
  sede: [
    'sede', 'sede_regional', 'ubicacion_sede',
    'nivel_central_o_direccion_territorial', 'nivel_central', 'direccion_territorial',
  ],
  asset_id_custom: [
    'id_del_activo', 'id_activo_interno', 'codigo_interno',
  ],
  trd_serie: [
    'trd_serie_sub_serie', 'trd_serie_subserie', 'trd', 'trd_serie', 'serie_documental',
  ],
  name: [
    'nombre_del_activo', 'nombre_activo', 'nombre', 'name', 'asset_name',
    'nombre_o_titulo_de_categoria_de_informacion',
    'nombre_o_titulo_de_categoria_de_informacion_nombre_del_activo',
  ],
  asset_type: [
    'tipo_de_activo', 'tipo_activo', 'asset_type',
  ],
  description: [
    'descripcion_del_activo', 'descripcion_de_activo', 'descripcion', 'description',
  ],
  info_generation_date: [
    'fecha_generacion', 'fecha_de_generacion', 'fecha_generacion_informacion',
    'fecha_de_generacion_de_la_informacion', 'fecha_generacion_de_la_informacion',
  ],
  entry_date: [
    'fecha_ingreso', 'fecha_de_ingreso', 'fecha_alta',
    'fecha_de_ingreso_del_activo', 'fecha_ingreso_del_activo',
  ],
  exit_date: [
    'fecha_salida', 'fecha_de_salida', 'fecha_baja',
    'fecha_de_salida_del_activo', 'fecha_salida_del_activo',
  ],
  language: ['idioma', 'language'],
  format: ['formato', 'format', 'formato_archivo'],
  support: [
    'soporte', 'tipo_de_soporte', 'support',
    'soporte_medio_de_conservacion_consulta',
    'medio_de_conservacion_consulta',
  ],
  consultation_place: [
    'lugar_de_consulta', 'lugar_consulta',
    'lugar_de_consulta_lugar_de_consulta_informacion_publicada_o_disponible',
    'lugar_de_consulta_informacion_publicada_o_disponible',
  ],
  info_owner: [
    'propietario_del_activo', 'propietario', 'owner', 'duenio_del_activo',
    'nombre_del_responsable_de_la_produccion_de_la_informacion',
    'nombre_del_responsable_de_la_produccion_de_la_informacion_propietario_del_activo',
    'responsable_de_la_produccion_de_la_informacion',
  ],
  info_custodian: [
    'custodio_del_activo', 'custodio', 'custodian',
    'nombre_del_responsable_de_la_custodia_de_la_informacion',
    'nombre_del_responsable_de_la_custodia_de_la_informacion_custodio_del_activo',
    'responsable_de_la_custodia_de_la_informacion',
  ],
  update_frequency: [
    'frecuencia_actualizacion', 'frecuencia_de_actualizacion', 'frecuencia',
    'frecuencia_de_actualizacion_para_publicacion',
  ],
  icc_social_impact: [
    'impacto_social', 'icc_social',
    'impacto_social_0_5_de_poblacion_nacional_250_000_personas',
  ],
  icc_economic_impact: [
    'impacto_economico', 'icc_economico',
    'impacto_economico_pib_de_un_dia_o_0_123_del_pib_anual_464_619_736',
  ],
  icc_environmental_impact: [
    'impacto_ambiental', 'icc_ambiental',
    'impacto_ambiental_3_anos_en_recuperacion_si',
  ],
  icc_is_critical: [
    'activo_icc', 'icc_critico', 'es_icc', 'activo_de_icc',
  ],
  confidentiality: ['confidencialidad', 'confidentiality'],
  integrity: ['integridad', 'integrity'],
  availability: ['disponibilidad', 'availability'],
  confidentiality_value: ['c_1_5', 'c', 'valor_c', 'valor_confidencialidad'],
  integrity_value: ['i_1_5', 'i', 'valor_i', 'valor_integridad'],
  availability_value: ['d_1_5', 'd', 'valor_d', 'valor_disponibilidad'],
  exception_objective: [
    'objetivo_excepcion', 'objetivo_de_excepcion',
    'objetivo_legitimo_de_la_excepcion',
  ],
  constitutional_basis: [
    'fundamento_constitucional', 'fundamento_constitucional_o_legal',
  ],
  legal_exception_basis: [
    'fundamento_juridico', 'fundamento_legal_excepcion',
    'fundamento_juridico_de_la_excepcion',
  ],
  exception_scope: [
    'excepcion_total_parcial', 'alcance_excepcion', 'excepcion_total_o_parcial',
  ],
  classification_date: [
    'fecha_calificacion', 'fecha_clasificacion',
    'fecha_de_la_calificacion', 'fecha_de_la_calificacion_dd_mm_aaaa',
  ],
  classification_term: [
    'plazo_reserva', 'termino_reserva', 'plazo_de_clasificacion_o_reserva',
  ],
  contains_personal_data: [
    'datos_personales', 'contiene_datos_personales',
  ],
  contains_minors_data: [
    'datos_menores', 'contiene_datos_menores',
    'contiene_datos_personales_de_ninos_ninas_o_adolescentes',
    'datos_personales_de_ninos_ninas_o_adolescentes',
  ],
  personal_data_type: [
    'tipo_dato_personal', 'tipo_datos_personales', 'clasificacion_dato_personal',
    'tipos_de_datos_personales',
  ],
  personal_data_purpose: [
    'finalidad_recoleccion', 'finalidad_tratamiento',
    'finalidad_de_la_recoleccion_de_los_datos_personales',
  ],
  has_data_authorization: [
    'autorizacion_tratamiento', 'autorizacion_titular',
    'existe_la_autorizacion_para_el_tratamiento_de_los_datos_personales',
    'autorizacion_para_el_tratamiento_de_los_datos_personales',
  ],
};

interface ColumnMap {
  [field: string]: number; // 1-indexed column number
}

/**
 * Minimum number of recognized columns to accept a row as the header row.
 * Document metadata rows (with just "Código:", "Versión:", "Fecha:") will
 * map ≤ 1 column and must NOT be confused with the real header row.
 */
const MIN_HEADER_MATCHES = 5;

/**
 * Scans the first 25 rows and picks the row with the MOST recognized
 * columns as the header row (must have at least MIN_HEADER_MATCHES).
 * This handles PNNC-style multi-row headers where rows 1-7 are document
 * metadata + section titles and the real column headers are at row 8.
 */
function detectHeaders(sheet: ExcelJS.Worksheet): {
  headerRow: number;
  columnMap: ColumnMap;
  unmappedHeaders: string[];
  allHeaders: string[];
} | null {
  const maxScan = Math.min(25, sheet.rowCount || 25);

  let best: {
    headerRow: number;
    columnMap: ColumnMap;
    unmappedHeaders: string[];
    allHeaders: string[];
    matchCount: number;
  } | null = null;

  for (let r = 1; r <= maxScan; r++) {
    const row = sheet.getRow(r);
    const headers: Array<{ col: number; raw: string; normalized: string }> = [];
    const seenNormalized = new Set<string>();

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const raw = cellToString(cell.value);
      if (!raw) return;
      // Reject header cells that are document metadata labels (end with ":")
      if (raw.trim().endsWith(':')) return;
      const normalized = normalizeHeader(raw);
      if (!normalized) return;
      // Skip duplicate cell values caused by merged cells reporting the same value
      if (seenNormalized.has(normalized)) return;
      seenNormalized.add(normalized);
      headers.push({ col: colNumber, raw, normalized });
    });

    if (headers.length < MIN_HEADER_MATCHES) continue;

    // Build column map for this row
    const columnMap: ColumnMap = {};
    const unmapped: string[] = [];
    const allRaw: string[] = [];

    for (const h of headers) {
      allRaw.push(h.raw);
      let matched = false;
      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (columnMap[field]) continue; // first occurrence wins
        if (aliases.includes(h.normalized)) {
          columnMap[field] = h.col;
          matched = true;
          break;
        }
      }
      if (!matched) unmapped.push(h.raw);
    }

    const matchCount = Object.keys(columnMap).length;

    // Need at least MIN_HEADER_MATCHES recognized columns AND must include BOTH 'code' AND 'name'
    // (metadata rows like "Código:" alone won't have a name column)
    if (matchCount >= MIN_HEADER_MATCHES && columnMap.code && columnMap.name) {
      if (!best || matchCount > best.matchCount) {
        best = { headerRow: r, columnMap, unmappedHeaders: unmapped, allHeaders: allRaw, matchCount };
      }
    }
  }

  if (!best) return null;
  return {
    headerRow: best.headerRow,
    columnMap: best.columnMap,
    unmappedHeaders: best.unmappedHeaders,
    allHeaders: best.allHeaders,
  };
}

/** Helper: read a cell only if the field was mapped. */
function readCell(row: ExcelJS.Row, columnMap: ColumnMap, field: string): ExcelJS.CellValue | undefined {
  const col = columnMap[field];
  if (!col) return undefined;
  return row.getCell(col).value;
}

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

    const detected = detectHeaders(sheet);
    if (!detected) {
      const firstRowSample: string[] = [];
      sheet.getRow(1).eachCell({ includeEmpty: false }, (c) => {
        const v = cellToString(c.value);
        if (v) firstRowSample.push(v.slice(0, 30));
      });
      return {
        ok: false,
        error: 'No se pudo detectar la cabecera del archivo. Asegúrate de tener una columna llamada "Codigo" o "Código".',
        diagnostic: {
          sheetName: sheet.name,
          headerRow: 0,
          rowsScanned: Math.min(15, sheet.rowCount || 15),
          columnsMapped: 0,
          unmappedHeaders: [],
          sampleHeaders: firstRowSample.slice(0, 10),
        },
      };
    }

    const { headerRow, columnMap, unmappedHeaders, allHeaders } = detected;
    const dataStartRow = headerRow + 1;

    const errors: ImportResult['errors'] = [];
    const records: Array<Record<string, unknown>> = [];
    let rowsScanned = 0;

    const lastRow = Math.max(sheet.rowCount, sheet.actualRowCount);

    for (let r = dataStartRow; r <= lastRow; r++) {
      const row = sheet.getRow(r);
      rowsScanned++;

      const code = cellToString(readCell(row, columnMap, 'code'));
      const name = cellToString(readCell(row, columnMap, 'name'));

      // Skip totally blank rows
      if (!code && !name) continue;

      if (!code) {
        errors.push({ row: r, message: 'Falta código' });
        continue;
      }
      if (!name) {
        errors.push({ row: r, code, message: 'Falta nombre' });
        continue;
      }

      const record: Record<string, unknown> = {
        organization_id: orgId,
        code,
        name,
        process_type: parseEnum(readCell(row, columnMap, 'process_type'), PROCESS_TYPE_MAP),
        process_name: cellToString(readCell(row, columnMap, 'process_name')) || null,
        sede: cellToString(readCell(row, columnMap, 'sede')) || null,
        asset_id_custom: cellToString(readCell(row, columnMap, 'asset_id_custom')) || null,
        trd_serie: cellToString(readCell(row, columnMap, 'trd_serie')) || null,
        asset_type: parseEnum(readCell(row, columnMap, 'asset_type'), ASSET_TYPE_MAP, 'data') ?? 'data',
        description: cellToString(readCell(row, columnMap, 'description')) || null,
        info_generation_date: parseDate(readCell(row, columnMap, 'info_generation_date')),
        entry_date: parseDate(readCell(row, columnMap, 'entry_date')),
        exit_date: parseDate(readCell(row, columnMap, 'exit_date')),
        language: parseEnum(readCell(row, columnMap, 'language'), LANGUAGE_MAP, 'espanol') ?? 'espanol',
        format: cellToString(readCell(row, columnMap, 'format')) || null,
        support: parseEnum(readCell(row, columnMap, 'support'), SUPPORT_MAP, 'na') ?? 'na',
        consultation_place: cellToString(readCell(row, columnMap, 'consultation_place')) || null,
        info_owner: cellToString(readCell(row, columnMap, 'info_owner')) || null,
        info_custodian: cellToString(readCell(row, columnMap, 'info_custodian')) || null,
        update_frequency: parseEnum(readCell(row, columnMap, 'update_frequency'), UPDATE_FREQ_MAP),
        icc_social_impact: parseSiNo(readCell(row, columnMap, 'icc_social_impact')) ?? false,
        icc_economic_impact: parseSiNo(readCell(row, columnMap, 'icc_economic_impact')) ?? false,
        icc_environmental_impact: parseSiNo(readCell(row, columnMap, 'icc_environmental_impact')) ?? false,
        icc_is_critical: parseSiNo(readCell(row, columnMap, 'icc_is_critical')) ?? false,
        confidentiality: parseEnum(readCell(row, columnMap, 'confidentiality'), CIA_LEVEL_MAP),
        integrity: parseEnum(readCell(row, columnMap, 'integrity'), CIA_LEVEL_MAP),
        availability: parseEnum(readCell(row, columnMap, 'availability'), CIA_LEVEL_MAP),
        confidentiality_value: parseInt15(readCell(row, columnMap, 'confidentiality_value')),
        integrity_value: parseInt15(readCell(row, columnMap, 'integrity_value')),
        availability_value: parseInt15(readCell(row, columnMap, 'availability_value')),
        exception_objective: cellToString(readCell(row, columnMap, 'exception_objective')) || null,
        constitutional_basis: cellToString(readCell(row, columnMap, 'constitutional_basis')) || null,
        legal_exception_basis: cellToString(readCell(row, columnMap, 'legal_exception_basis')) || null,
        exception_scope: cellToString(readCell(row, columnMap, 'exception_scope')) || null,
        classification_date: parseDate(readCell(row, columnMap, 'classification_date')),
        classification_term: cellToString(readCell(row, columnMap, 'classification_term')) || null,
        contains_personal_data: parseSiNo(readCell(row, columnMap, 'contains_personal_data')) ?? false,
        contains_minors_data: parseSiNo(readCell(row, columnMap, 'contains_minors_data')) ?? false,
        personal_data_type: parseEnum(readCell(row, columnMap, 'personal_data_type'), PERSONAL_DATA_TYPE_MAP, 'na') ?? 'na',
        personal_data_purpose: cellToString(readCell(row, columnMap, 'personal_data_purpose')) || null,
        has_data_authorization: parseSiNo(readCell(row, columnMap, 'has_data_authorization')),
        status: 'active',
        criticality: 'medium',
        updated_by: user.id,
      };

      records.push(record);
    }

    const diagnostic = {
      sheetName: sheet.name,
      headerRow,
      rowsScanned,
      columnsMapped: Object.keys(columnMap).length,
      unmappedHeaders: unmappedHeaders.slice(0, 10),
      sampleHeaders: allHeaders.slice(0, 10),
    };

    if (records.length === 0 && errors.length === 0) {
      return {
        ok: false,
        error: `Cabecera detectada en fila ${headerRow} pero no se encontraron filas con datos a partir de la fila ${dataStartRow}`,
        diagnostic,
      };
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

    return {
      ok: true,
      inserted,
      updated,
      skipped,
      errors: errors.length ? errors : undefined,
      diagnostic,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al importar';
    console.error('[importAssets]', err);
    return { ok: false, error: msg };
  }
}
