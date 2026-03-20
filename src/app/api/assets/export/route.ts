import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Get user's org
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Sin organizacion' }, { status: 403 });
  }

  const orgId = membership.organization_id;

  // Get org info
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', orgId)
    .single();

  // Get all assets
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('organization_id', orgId)
    .order('code', { ascending: true });

  const assetList = assets || [];

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust - SGSI';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Inventario de Activos', {
    properties: { defaultColWidth: 18 },
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  // Colors
  const headerBg = '1B3A5C';
  const subHeaderBg = '2D5F8A';
  const lightBg = 'F2F7FB';
  const borderColor = 'B0C4D8';
  const white = 'FFFFFF';

  // =========================================
  // ROW 1: TITLE HEADER
  // =========================================
  sheet.mergeCells('A1:AO1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'FORMATO INVENTARIO DE ACTIVOS DE INFORMACION';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: headerBg } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;

  // Row 2: Org info + date
  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = org?.name || 'Organizacion';
  sheet.getCell('A2').font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: headerBg },
  };
  sheet.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('AF2:AO2');
  sheet.getCell('AF2').value = `Fecha: ${new Date().toLocaleDateString('es-CO')}`;
  sheet.getCell('AF2').font = { name: 'Calibri', size: 9, color: { argb: '666666' } };
  sheet.getCell('AF2').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getRow(2).height = 20;

  // =========================================
  // ROW 3: MAIN SECTION HEADERS
  // =========================================
  const sectionHeaders = [
    { start: 'A', end: 'O', title: '1. Identificacion de Activo de Informacion' },
    { start: 'P', end: 'Q', title: '1.2 Ubicacion' },
    { start: 'R', end: 'T', title: '1.3 Propiedad' },
    { start: 'U', end: 'X', title: '2. Infraestructura Critica Cibernetica (ICC)' },
    { start: 'Y', end: 'AF', title: '3. Clasificacion de los Activos de Informacion' },
    { start: 'AG', end: 'AL', title: '4. Indice de Informacion Clasificada y Reservada' },
    { start: 'AM', end: 'AO', title: '5. Datos Personales (Ley 1581 de 2012)' },
  ];

  sheet.getRow(3).height = 28;
  for (const section of sectionHeaders) {
    sheet.mergeCells(`${section.start}3:${section.end}3`);
    const cell = sheet.getCell(`${section.start}3`);
    cell.value = section.title;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: borderColor } },
      bottom: { style: 'thin', color: { argb: borderColor } },
      left: { style: 'thin', color: { argb: borderColor } },
      right: { style: 'thin', color: { argb: borderColor } },
    };
  }

  // =========================================
  // ROW 4: COLUMN HEADERS
  // =========================================
  const columns = [
    // Section 1: Identification (A-O) — 15 cols
    'ID\nActivo',
    'Codigo',
    'Tipo de\nProceso',
    'Proceso',
    'Sede',
    'ID del\nActivo',
    'TRD Serie\nSub Serie',
    'Nombre del\nActivo',
    'Tipo de\nActivo',
    'Descripcion\ndel Activo',
    'Fecha\nGeneracion',
    'Fecha\nIngreso',
    'Fecha\nSalida',
    'Idioma',
    'Formato',
    // Section 1.2: Location (P-Q) — 2 cols
    'Soporte',
    'Lugar de\nConsulta',
    // Section 1.3: Ownership (R-T) — 3 cols
    'Propietario\ndel Activo',
    'Custodio\ndel Activo',
    'Frecuencia\nActualizacion',
    // Section 2: ICC (U-X) — 4 cols
    'Impacto\nSocial',
    'Impacto\nEconomico',
    'Impacto\nAmbiental',
    'Activo\nICC',
    // Section 3: CIA (Y-AF) — 8 cols
    'Confidencialidad',
    'Integridad',
    'Disponibilidad',
    'C\n(1-5)',
    'I\n(1-5)',
    'D\n(1-5)',
    'V\n(Total)',
    'Criticidad\nCID',
    // Section 4: Classified Info (AG-AL) — 6 cols
    'Objetivo\nExcepcion',
    'Fundamento\nConstitucional',
    'Fundamento\nJuridico',
    'Excepcion\nTotal/Parcial',
    'Fecha\nCalificacion',
    'Plazo\nReserva',
    // Section 5: Personal Data (AM-AO) — 5 cols (total = 43)
    'Datos\nPersonales',
    'Datos\nMenores',
    'Tipo Dato\nPersonal',
    'Finalidad\nRecoleccion',
    'Autorizacion\nTratamiento',
  ];

  const headerRow = sheet.getRow(4);
  headerRow.height = 45;
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col;
    cell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subHeaderBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: borderColor } },
      bottom: { style: 'thin', color: { argb: borderColor } },
      left: { style: 'thin', color: { argb: borderColor } },
      right: { style: 'thin', color: { argb: borderColor } },
    };
  });

  // =========================================
  // DATA ROWS
  // =========================================
  const boolToSiNo = (val: boolean | null | undefined): string => {
    if (val === true) return 'SI';
    if (val === false) return 'NO';
    return '-';
  };

  const formatDate = (d: string | null | undefined): string => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-CO');
  };

  assetList.forEach((asset, idx) => {
    const row = sheet.getRow(5 + idx);

    const values: (string | number)[] = [
      // Section 1: Identification
      idx + 1,
      asset.code || '-',
      asset.process_type?.replace(/_/g, ' ') || '-',
      asset.process_name || '-',
      asset.sede || '-',
      asset.asset_id_custom || '-',
      asset.trd_serie || '-',
      asset.name || '-',
      asset.asset_type?.replace(/_/g, ' ') || '-',
      asset.description || '-',
      formatDate(asset.info_generation_date),
      formatDate(asset.entry_date),
      formatDate(asset.exit_date),
      asset.language || '-',
      asset.format || '-',
      // Section 1.2: Location
      asset.support?.replace(/_/g, ' / ') || '-',
      asset.consultation_place || '-',
      // Section 1.3: Ownership
      asset.info_owner || '-',
      asset.info_custodian || '-',
      asset.update_frequency?.replace(/_/g, ' ') || '-',
      // Section 2: ICC
      boolToSiNo(asset.icc_social_impact),
      boolToSiNo(asset.icc_economic_impact),
      boolToSiNo(asset.icc_environmental_impact),
      boolToSiNo(asset.icc_is_critical),
      // Section 3: CIA
      asset.confidentiality || '-',
      asset.integrity || '-',
      asset.availability || '-',
      asset.confidentiality_value ?? 1,
      asset.integrity_value ?? 1,
      asset.availability_value ?? 1,
      asset.total_value || '-',
      asset.criticality_cid || '-',
      // Section 4: Classified Info
      asset.exception_objective || '-',
      asset.constitutional_basis || '-',
      asset.legal_exception_basis || '-',
      asset.exception_scope || '-',
      formatDate(asset.classification_date),
      asset.classification_term || '-',
      // Section 5: Personal Data
      boolToSiNo(asset.contains_personal_data),
      boolToSiNo(asset.contains_minors_data),
      asset.personal_data_type?.replace(/_/g, ' ') || '-',
      asset.personal_data_purpose || '-',
      boolToSiNo(asset.has_data_authorization),
    ];

    values.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 8 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'thin', color: { argb: 'E0E0E0' } },
        right: { style: 'thin', color: { argb: 'E0E0E0' } },
      };
      // Alternate row background
      if (idx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBg } };
      }
    });

    // Color-code Criticidad CID (column 32)
    const critCell = row.getCell(32);
    if (asset.criticality_cid === 'Alto') {
      critCell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'CC0000' } };
    } else if (asset.criticality_cid === 'Medio') {
      critCell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'CC8800' } };
    } else {
      critCell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: '008800' } };
    }

    // Color-code Activo ICC (column 24)
    const iccCell = row.getCell(24);
    if (asset.icc_is_critical) {
      iccCell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'CC0000' } };
    }

    row.height = 22;
  });

  // =========================================
  // COLUMN WIDTHS
  // =========================================
  const widths = [
    // Section 1 (15)
    5, 10, 14, 25, 20, 10, 15, 30, 14, 35, 12, 12, 12, 10, 20,
    // Section 1.2 (2)
    15, 25,
    // Section 1.3 (3)
    25, 25, 15,
    // Section 2 (4)
    10, 10, 10, 10,
    // Section 3 (8)
    14, 14, 14, 6, 6, 6, 8, 12,
    // Section 4 (6)
    15, 30, 20, 12, 12, 12,
    // Section 5 (5)
    10, 10, 15, 30, 12,
  ];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  // Auto-filter on header row
  sheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + assetList.length, column: columns.length },
  };

  // Freeze header rows and first 2 columns
  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 4 }];

  // Generate buffer and return as downloadable file
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="inventario-activos-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
