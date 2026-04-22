import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { getIntegrationKPIs } from '@/features/compliance/services/integrationMetricsService';
import { styleHeaderRow, addTitleBlock, xlsxResponseHeaders } from '@/features/reporting/services/xlsxHelpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { orgId, organization } = await requireOrg();
  const supabase = await createClient();
  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';

  const [frameworks, kpis] = await Promise.all([
    getFrameworksWithCompliance(orgId),
    getIntegrationKPIs(orgId),
  ]);

  // Fetch additional KPIs: risks by level, active incidents, open NCs, open vulns
  const [
    criticalRisksRes,
    highRisksRes,
    mediumRisksRes,
    lowRisksRes,
    openIncidentsRes,
    closedIncidentsLastYearRes,
    openNcsRes,
    closedNcsLastYearRes,
    openVulnsRes,
    implementedCtrlsRes,
    totalCtrlsRes,
  ] = await Promise.all([
    supabase.from('risk_scenarios').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('risk_level_residual', 'critical'),
    supabase.from('risk_scenarios').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('risk_level_residual', 'high'),
    supabase.from('risk_scenarios').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('risk_level_residual', 'medium'),
    supabase.from('risk_scenarios').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('risk_level_residual', 'low'),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).neq('status', 'closed'),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'closed').gte('closed_at', new Date(Date.now() - 365 * 86400000).toISOString()),
    supabase.from('nonconformities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).neq('status', 'closed'),
    supabase.from('nonconformities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'closed'),
    supabase.from('vulnerabilities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open'),
    supabase.from('controls').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'implemented'),
    supabase.from('controls').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
  ]);

  const cnt = (r: { count: number | null }) => r.count ?? 0;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust';
  workbook.created = new Date();

  // Sheet 1: Executive KPIs
  const s1 = workbook.addWorksheet('Resumen ejecutivo');
  s1.columns = [
    { header: 'Indicador', key: 'name', width: 40 },
    { header: 'Valor', key: 'val', width: 18 },
    { header: 'Estado', key: 'st', width: 18 },
  ];

  const complianceAvg = frameworks.length > 0
    ? Math.round(frameworks.reduce((sum, fw) => sum + fw.compliance_percentage, 0) / frameworks.length)
    : 0;

  const implementedCtrls = cnt(implementedCtrlsRes);
  const totalCtrls = cnt(totalCtrlsRes);
  const ctrlRatio = totalCtrls > 0 ? Math.round((implementedCtrls / totalCtrls) * 100) : 0;

  const criticalRisks = cnt(criticalRisksRes);
  const highRisks = cnt(highRisksRes);

  const kpiRows: Array<[string, string | number, string]> = [
    ['Cumplimiento global promedio', `${complianceAvg}%`, stateFor(complianceAvg, 80, 60)],
    ['Frameworks activos', frameworks.length, 'info'],
    ['Controles implementados', `${implementedCtrls} / ${totalCtrls} (${ctrlRatio}%)`, stateFor(ctrlRatio, 80, 60)],
    ['Riesgos residuales críticos', criticalRisks, criticalRisks > 0 ? 'critical' : 'ok'],
    ['Riesgos residuales altos', highRisks, highRisks > 5 ? 'alert' : 'ok'],
    ['Riesgos residuales medios', cnt(mediumRisksRes), 'info'],
    ['Riesgos residuales bajos', cnt(lowRisksRes), 'info'],
    ['Incidentes activos', cnt(openIncidentsRes), cnt(openIncidentsRes) > 0 ? 'alert' : 'ok'],
    ['Incidentes cerrados último año', cnt(closedIncidentsLastYearRes), 'info'],
    ['No conformidades abiertas', cnt(openNcsRes), cnt(openNcsRes) > 0 ? 'alert' : 'ok'],
    ['No conformidades cerradas', cnt(closedNcsLastYearRes), 'info'],
    ['Vulnerabilidades abiertas', cnt(openVulnsRes), cnt(openVulnsRes) > 0 ? 'alert' : 'ok'],
    ['Riesgos con controles', `${kpis.risksWithControls} / ${kpis.totalRisks}`, stateFor(ratio(kpis.risksWithControls, kpis.totalRisks), 80, 50)],
    ['Controles alineados a framework', `${kpis.controlsWithRequirement} / ${kpis.totalControls}`, stateFor(ratio(kpis.controlsWithRequirement, kpis.totalControls), 80, 50)],
    ['Vulns vinculadas a riesgo', `${kpis.vulnerabilitiesLinkedToRisks} / ${kpis.totalVulnerabilities}`, 'info'],
    ['Incidentes vinculados a riesgo', `${kpis.incidentsLinkedToRisks} / ${kpis.totalIncidents}`, 'info'],
    ['Mapeos cross-framework', kpis.crossFrameworkMappings, 'info'],
  ];

  for (const [name, val, st] of kpiRows) {
    const row = s1.addRow({ name, val, st: labelState(st) });
    const argb = stateColor(st);
    if (argb) {
      row.getCell('st').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    }
  }

  styleHeaderRow(s1, 'FF0EA5E9');
  addTitleBlock(s1, 'Resumen Ejecutivo de Cumplimiento', orgName, s1.columns.length);

  // Sheet 2: Framework posture
  const s2 = workbook.addWorksheet('Cumplimiento por framework');
  s2.columns = [
    { header: 'Framework', key: 'name', width: 40 },
    { header: 'Requisitos totales', key: 'total', width: 18 },
    { header: 'Cumple', key: 'c', width: 10 },
    { header: 'Parcial', key: 'p', width: 10 },
    { header: 'No cumple', key: 'nc', width: 12 },
    { header: '% Cumplimiento', key: 'pct', width: 16 },
  ];
  for (const fw of frameworks) {
    const row = s2.addRow({
      name: fw.name,
      total: fw.total_requirements,
      c: fw.compliant_count,
      p: fw.partial_count,
      nc: fw.non_compliant_count,
      pct: `${fw.compliance_percentage}%`,
    });
    const pct = fw.compliance_percentage;
    const argb = pct >= 80 ? 'FFBBF7D0' : pct >= 60 ? 'FFFEF3C7' : pct >= 40 ? 'FFFED7AA' : 'FFFECACA';
    row.getCell('pct').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
  }
  styleHeaderRow(s2);
  addTitleBlock(s2, 'Postura por Framework', orgName, s2.columns.length);

  // Sheet 3: Top risks without controls
  if (kpis.topRisksWithoutControls.length > 0) {
    const s3 = workbook.addWorksheet('Gaps - Riesgos sin controles');
    s3.columns = [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Riesgo', key: 'name', width: 48 },
      { header: 'Nivel residual', key: 'level', width: 16 },
    ];
    for (const r of kpis.topRisksWithoutControls) {
      s3.addRow({ code: r.code, name: r.name, level: r.risk_level_residual });
    }
    styleHeaderRow(s3, 'FFDC2626');
    addTitleBlock(s3, 'Top Riesgos sin Controles', orgName, s3.columns.length);
  }

  if (kpis.topControlsWithoutRequirement.length > 0) {
    const s4 = workbook.addWorksheet('Gaps - Controles sin requisito');
    s4.columns = [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Control', key: 'name', width: 48 },
      { header: 'Estado', key: 'status', width: 20 },
    ];
    for (const c of kpis.topControlsWithoutRequirement) {
      s4.addRow({ code: c.code, name: c.name, status: c.status });
    }
    styleHeaderRow(s4, 'FFF59E0B');
    addTitleBlock(s4, 'Top Controles sin Requisito', orgName, s4.columns.length);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `bc-trust-executive-summary-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer, { headers: xlsxResponseHeaders(filename) });
}

function ratio(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

function stateFor(val: number, okThreshold: number, warnThreshold: number): string {
  if (val >= okThreshold) return 'ok';
  if (val >= warnThreshold) return 'alert';
  return 'critical';
}

function labelState(s: string): string {
  const map: Record<string, string> = { ok: 'OK', alert: 'Atención', critical: 'Crítico', info: 'Info' };
  return map[s] ?? s;
}

function stateColor(s: string): string | null {
  const map: Record<string, string> = {
    ok: 'FFBBF7D0',
    alert: 'FFFEF3C7',
    critical: 'FFFECACA',
  };
  return map[s] ?? null;
}
