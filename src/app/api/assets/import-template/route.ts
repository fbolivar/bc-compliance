import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust - SGSI';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Inventario de Activos', {
    properties: { defaultColWidth: 18 },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  const headerBg = '1B3A5C';
  const subHeaderBg = '2D5F8A';
  const exampleBg = 'FFF8DC';
  const borderColor = 'B0C4D8';
  const white = 'FFFFFF';

  // Row 1: Title
  sheet.mergeCells('A1:AO1');
  const title = sheet.getCell('A1');
  title.value = 'PLANTILLA DE IMPORTACIÓN — INVENTARIO DE ACTIVOS DE INFORMACIÓN';
  title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: headerBg } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;

  // Row 2: Instructions
  sheet.mergeCells('A2:AO2');
  const inst = sheet.getCell('A2');
  inst.value = 'Llena los datos a partir de la fila 5. Las columnas Codigo (B) y Nombre del Activo (H) son obligatorias. Filas en amarillo son ejemplos — bórralas antes de importar.';
  inst.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '666666' } };
  inst.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  sheet.getRow(2).height = 20;

  // Row 3: Section headers (same as export)
  const sections = [
    { start: 'A', end: 'O', title: '1. Identificacion de Activo de Informacion' },
    { start: 'P', end: 'Q', title: '1.2 Ubicacion' },
    { start: 'R', end: 'T', title: '1.3 Propiedad' },
    { start: 'U', end: 'X', title: '2. Infraestructura Critica Cibernetica (ICC)' },
    { start: 'Y', end: 'AF', title: '3. Clasificacion de los Activos de Informacion' },
    { start: 'AG', end: 'AL', title: '4. Indice de Informacion Clasificada y Reservada' },
    { start: 'AM', end: 'AO', title: '5. Datos Personales (Ley 1581 de 2012)' },
  ];
  sheet.getRow(3).height = 28;
  for (const s of sections) {
    sheet.mergeCells(`${s.start}3:${s.end}3`);
    const c = sheet.getCell(`${s.start}3`);
    c.value = s.title;
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: white } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = {
      top: { style: 'thin', color: { argb: borderColor } },
      bottom: { style: 'thin', color: { argb: borderColor } },
      left: { style: 'thin', color: { argb: borderColor } },
      right: { style: 'thin', color: { argb: borderColor } },
    };
  }

  // Row 4: Column headers (must match the parser positions exactly)
  const columns = [
    'ID\nActivo', 'Codigo', 'Tipo de\nProceso', 'Proceso', 'Sede',
    'ID del\nActivo', 'TRD Serie\nSub Serie', 'Nombre del\nActivo', 'Tipo de\nActivo',
    'Descripcion\ndel Activo', 'Fecha\nGeneracion', 'Fecha\nIngreso', 'Fecha\nSalida',
    'Idioma', 'Formato',
    'Soporte', 'Lugar de\nConsulta',
    'Propietario\ndel Activo', 'Custodio\ndel Activo', 'Frecuencia\nActualizacion',
    'Impacto\nSocial', 'Impacto\nEconomico', 'Impacto\nAmbiental', 'Activo\nICC',
    'Confidencialidad', 'Integridad', 'Disponibilidad',
    'C\n(1-5)', 'I\n(1-5)', 'D\n(1-5)', 'V\n(Total)', 'Criticidad\nCID',
    'Objetivo\nExcepcion', 'Fundamento\nConstitucional', 'Fundamento\nJuridico',
    'Excepcion\nTotal/Parcial', 'Fecha\nCalificacion', 'Plazo\nReserva',
    'Datos\nPersonales', 'Datos\nMenores', 'Tipo Dato\nPersonal',
    'Finalidad\nRecoleccion', 'Autorizacion\nTratamiento',
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

  // Row 5: Example row
  const example = [
    1,
    'ACT-001',                          // codigo (REQUIRED)
    'misional',                         // process_type: estrategico/misional/apoyo/seguimiento_control
    'Conservación de áreas protegidas', // process_name
    'Sede Central Bogotá',              // sede
    'PNN-INF-001',                      // asset_id_custom
    '100.5.1',                          // trd_serie
    'Base de datos de visitantes',      // name (REQUIRED)
    'data',                             // asset_type: hardware/software/network/data/personnel/facility/service/intangible/cloud_resource/iot_device
    'Registro consolidado de visitantes a parques nacionales', // description
    '15/01/2024',                       // info_generation_date (DD/MM/YYYY)
    '01/02/2024',                       // entry_date
    '',                                 // exit_date
    'espanol',                          // language: espanol/ingles/otro
    'Base de datos PostgreSQL',         // format
    'electronico',                      // support: fisico/electronico/digital/fisico_electronico/etc
    'Servidor central',                 // consultation_place
    'Subdirección de Sostenibilidad',   // info_owner
    'Coordinación TI',                  // info_custodian
    'mensual',                          // update_frequency
    'NO', 'SI', 'NO', 'NO',             // ICC: social/economico/ambiental/critico (SI o NO)
    'medio', 'alto', 'alto',            // CIA cualitativo: alto/medio/bajo
    3, 4, 4,                            // CIA numérico (1-5)
    '', '',                             // V Total y Criticidad CID se calculan, dejar vacío
    'Publica',                          // exception_objective
    '', '', '', '', '',                 // resto excepción
    'SI', 'NO', 'privado',              // datos personales / menores / tipo
    'Estadísticas de visitación',       // personal_data_purpose
    'SI',                               // has_data_authorization
  ];

  const exRow = sheet.getRow(5);
  example.forEach((val, i) => {
    const cell = exRow.getCell(i + 1);
    cell.value = val;
    cell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '8B6914' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: exampleBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'E0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
      left: { style: 'thin', color: { argb: 'E0E0E0' } },
      right: { style: 'thin', color: { argb: 'E0E0E0' } },
    };
  });
  exRow.height = 22;

  // Column widths (same as export)
  const widths = [
    5, 10, 14, 25, 20, 10, 15, 30, 14, 35, 12, 12, 12, 10, 20,
    15, 25, 25, 25, 15, 10, 10, 10, 10,
    14, 14, 14, 6, 6, 6, 8, 12,
    15, 30, 20, 12, 12, 12, 10, 10, 15, 30, 12,
  ];
  widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 4 }];

  // Validation reference sheet
  const ref = workbook.addWorksheet('Valores válidos');
  ref.getRow(1).values = ['Campo', 'Valores aceptados'];
  ref.getRow(1).font = { bold: true, color: { argb: white } };
  ref.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };

  const refData: Array<[string, string]> = [
    ['Tipo de Proceso', 'estrategico, misional, apoyo, seguimiento_control'],
    ['Tipo de Activo', 'hardware, software, network, data, personnel, facility, service, intangible, cloud_resource, iot_device'],
    ['Idioma', 'espanol, ingles, otro'],
    ['Soporte', 'fisico, electronico, digital, fisico_electronico, fisico_digital, electronico_digital, fisico_electronico_digital, na'],
    ['Frecuencia Actualización', 'diaria, semanal, quincenal, mensual, trimestral, semestral, anual, segun_requerimiento'],
    ['Confidencialidad / Integridad / Disponibilidad (cualitativo)', 'alto, medio, bajo'],
    ['Confidencialidad / Integridad / Disponibilidad (numérico)', '1, 2, 3, 4, 5'],
    ['Tipo Dato Personal', 'publico, privado, semiprivado, sensible, na'],
    ['Booleanos (ICC, Datos Personales, Menores, Autorización)', 'SI o NO'],
    ['Fechas', 'Formato DD/MM/YYYY (ej: 15/01/2024)'],
  ];
  refData.forEach((row, i) => {
    ref.getRow(i + 2).values = row;
    ref.getRow(i + 2).getCell(2).alignment = { wrapText: true, vertical: 'top' };
  });
  ref.getColumn(1).width = 45;
  ref.getColumn(2).width = 80;

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="bc-trust-plantilla-activos.xlsx"',
    },
  });
}
