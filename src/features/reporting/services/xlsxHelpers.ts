import type ExcelJS from 'exceljs';

export function styleHeaderRow(sheet: ExcelJS.Worksheet, fillArgb = 'FF0EA5E9') {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
  header.height = 22;
  header.alignment = { vertical: 'middle', horizontal: 'left' };
}

export function addTitleBlock(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  totalColumns: number,
) {
  sheet.insertRow(1, [title]);
  sheet.insertRow(2, [subtitle]);
  sheet.insertRow(3, [`Generado: ${new Date().toLocaleString('es-CO')}`]);
  sheet.insertRow(4, []);

  sheet.mergeCells(1, 1, 1, totalColumns);
  sheet.mergeCells(2, 1, 2, totalColumns);
  sheet.mergeCells(3, 1, 3, totalColumns);

  const titleCell = sheet.getCell(1, 1);
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF0EA5E9' } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.getRow(1).height = 26;

  const subCell = sheet.getCell(2, 1);
  subCell.font = { italic: true, size: 11, color: { argb: 'FF64748B' } };

  const dateCell = sheet.getCell(3, 1);
  dateCell.font = { size: 9, color: { argb: 'FF94A3B8' } };
}

export function xlsxResponseHeaders(filename: string): HeadersInit {
  return {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  };
}
