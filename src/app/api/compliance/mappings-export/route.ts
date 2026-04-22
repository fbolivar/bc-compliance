import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // 1) Control ↔ Requirement mappings
  const { data: ctrlReq } = await supabase
    .from('control_requirement_mappings')
    .select(`
      coverage_percentage,
      compliance_status,
      justification,
      controls(code, name, status),
      framework_requirements(code, name, frameworks(name))
    `)
    .eq('organization_id', orgId);

  // 2) Control ↔ Risk mappings
  const { data: ctrlRisk } = await supabase
    .from('control_risk_mappings')
    .select(`
      effectiveness,
      notes,
      controls(code, name, status),
      risk_scenarios(code, name, risk_level_residual, risk_residual)
    `)
    .eq('organization_id', orgId);

  // 3) Cross-framework
  const { data: cross } = await supabase
    .from('requirement_mappings')
    .select(`
      mapping_strength,
      notes,
      source:framework_requirements!requirement_mappings_source_requirement_id_fkey(code, name, frameworks(name)),
      target:framework_requirements!requirement_mappings_target_requirement_id_fkey(code, name, frameworks(name))
    `);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust';
  workbook.created = new Date();

  // Sheet 1: Control ↔ Requirement
  const s1 = workbook.addWorksheet('Controles-Requisitos');
  s1.columns = [
    { header: 'Framework', key: 'fw', width: 24 },
    { header: 'Cod. Requisito', key: 'reqCode', width: 14 },
    { header: 'Requisito', key: 'reqName', width: 48 },
    { header: 'Cod. Control', key: 'ctrlCode', width: 14 },
    { header: 'Control', key: 'ctrlName', width: 40 },
    { header: 'Estado control', key: 'ctrlStatus', width: 18 },
    { header: 'Cobertura %', key: 'coverage', width: 12 },
    { header: 'Cumplimiento', key: 'compliance', width: 18 },
    { header: 'Justificación', key: 'just', width: 60 },
  ];

  type CR = {
    coverage_percentage: number;
    compliance_status: string;
    justification: string | null;
    controls: { code: string; name: string; status: string } | null;
    framework_requirements: { code: string; name: string; frameworks: { name: string } | null } | null;
  };
  (ctrlReq as unknown as CR[] ?? []).forEach((r) => {
    s1.addRow({
      fw: r.framework_requirements?.frameworks?.name ?? '',
      reqCode: r.framework_requirements?.code ?? '',
      reqName: r.framework_requirements?.name ?? '',
      ctrlCode: r.controls?.code ?? '',
      ctrlName: r.controls?.name ?? '',
      ctrlStatus: r.controls?.status ?? '',
      coverage: r.coverage_percentage,
      compliance: r.compliance_status,
      just: r.justification ?? '',
    });
  });

  // Sheet 2: Control ↔ Risk
  const s2 = workbook.addWorksheet('Controles-Riesgos');
  s2.columns = [
    { header: 'Cod. Control', key: 'ctrlCode', width: 14 },
    { header: 'Control', key: 'ctrlName', width: 40 },
    { header: 'Estado control', key: 'ctrlStatus', width: 18 },
    { header: 'Cod. Riesgo', key: 'rCode', width: 14 },
    { header: 'Escenario', key: 'rName', width: 48 },
    { header: 'Nivel residual', key: 'rLevel', width: 16 },
    { header: 'Valor residual', key: 'rValue', width: 14 },
    { header: 'Efectividad %', key: 'eff', width: 14 },
    { header: 'Notas', key: 'notes', width: 60 },
  ];

  type CRi = {
    effectiveness: number;
    notes: string | null;
    controls: { code: string; name: string; status: string } | null;
    risk_scenarios: { code: string; name: string; risk_level_residual: string; risk_residual: number } | null;
  };
  (ctrlRisk as unknown as CRi[] ?? []).forEach((r) => {
    s2.addRow({
      ctrlCode: r.controls?.code ?? '',
      ctrlName: r.controls?.name ?? '',
      ctrlStatus: r.controls?.status ?? '',
      rCode: r.risk_scenarios?.code ?? '',
      rName: r.risk_scenarios?.name ?? '',
      rLevel: r.risk_scenarios?.risk_level_residual ?? '',
      rValue: r.risk_scenarios?.risk_residual ?? null,
      eff: r.effectiveness,
      notes: r.notes ?? '',
    });
  });

  // Sheet 3: Cross-framework
  const s3 = workbook.addWorksheet('Cross-Framework');
  s3.columns = [
    { header: 'Framework origen', key: 'srcFw', width: 24 },
    { header: 'Cod. origen', key: 'srcCode', width: 14 },
    { header: 'Requisito origen', key: 'srcName', width: 40 },
    { header: 'Relación', key: 'strength', width: 16 },
    { header: 'Framework destino', key: 'tgtFw', width: 24 },
    { header: 'Cod. destino', key: 'tgtCode', width: 14 },
    { header: 'Requisito destino', key: 'tgtName', width: 40 },
    { header: 'Notas', key: 'notes', width: 60 },
  ];

  type CF = {
    mapping_strength: string | null;
    notes: string | null;
    source: { code: string; name: string; frameworks: { name: string } | null } | null;
    target: { code: string; name: string; frameworks: { name: string } | null } | null;
  };
  (cross as unknown as CF[] ?? []).forEach((r) => {
    s3.addRow({
      srcFw: r.source?.frameworks?.name ?? '',
      srcCode: r.source?.code ?? '',
      srcName: r.source?.name ?? '',
      strength: r.mapping_strength ?? '',
      tgtFw: r.target?.frameworks?.name ?? '',
      tgtCode: r.target?.code ?? '',
      tgtName: r.target?.name ?? '',
      notes: r.notes ?? '',
    });
  });

  // Style headers
  [s1, s2, s3].forEach((sheet) => {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
    header.height = 22;
    header.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `bc-trust-mapeos-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
