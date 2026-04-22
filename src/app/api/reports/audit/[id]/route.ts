import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { styleHeaderRow, addTitleBlock, xlsxResponseHeaders } from '@/features/reporting/services/xlsxHelpers';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId, organization } = await requireOrg();
  const supabase = await createClient();
  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';

  // Fetch the audit
  const { data: audit } = await supabase
    .from('audit_programs')
    .select('*, frameworks(code, name)')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!audit) {
    return new NextResponse('Auditoría no encontrada', { status: 404 });
  }

  // Fetch enriched findings
  const { data: findings } = await supabase
    .from('audit_findings')
    .select(`
      *,
      framework_requirements(code, name, frameworks(name)),
      controls(code, name),
      nonconformities(code, title)
    `)
    .eq('audit_id', id)
    .eq('organization_id', orgId)
    .order('code');

  type Finding = {
    id: string;
    code: string;
    title: string;
    description: string | null;
    severity: string;
    status: string;
    clause_reference: string | null;
    finding_details: string | null;
    auditor_recommendation: string | null;
    management_response: string | null;
    response_due_date: string | null;
    closure_evidence: string | null;
    framework_requirements: { code: string; name: string; frameworks: { name: string } | null } | null;
    controls: { code: string; name: string } | null;
    nonconformities: { code: string; title: string } | null;
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BC Trust';
  workbook.created = new Date();

  // Sheet 1: audit summary
  const s1 = workbook.addWorksheet('Resumen');
  s1.columns = [
    { header: 'Campo', key: 'field', width: 28 },
    { header: 'Valor', key: 'value', width: 60 },
  ];

  const auditRow = audit as unknown as {
    code: string; title: string; description: string | null; audit_type: string; status: string;
    year: number | null; scope_description: string | null; departments: string[] | null;
    planned_start: string | null; planned_end: string | null; actual_start: string | null; actual_end: string | null;
    certification_body: string | null; certificate_number: string | null; certificate_expiry: string | null;
    frameworks: { name: string } | null;
  };

  const fieldsToShow = [
    ['Código', auditRow.code],
    ['Título', auditRow.title],
    ['Tipo', auditRow.audit_type?.replace(/_/g, ' ') ?? ''],
    ['Estado', auditRow.status?.replace(/_/g, ' ') ?? ''],
    ['Año', auditRow.year?.toString() ?? ''],
    ['Framework', auditRow.frameworks?.name ?? ''],
    ['Alcance', auditRow.scope_description ?? ''],
    ['Departamentos', auditRow.departments?.join(', ') ?? ''],
    ['Inicio planificado', fmt(auditRow.planned_start)],
    ['Fin planificado', fmt(auditRow.planned_end)],
    ['Inicio real', fmt(auditRow.actual_start)],
    ['Fin real', fmt(auditRow.actual_end)],
    ['Entidad certificadora', auditRow.certification_body ?? ''],
    ['Nº certificado', auditRow.certificate_number ?? ''],
    ['Vence certificado', fmt(auditRow.certificate_expiry)],
    ['Descripción', auditRow.description ?? ''],
  ];
  for (const [field, value] of fieldsToShow) {
    const row = s1.addRow({ field, value });
    row.getCell('field').font = { bold: true };
  }
  styleHeaderRow(s1);
  addTitleBlock(s1, `Informe de Auditoría — ${auditRow.code}`, orgName, s1.columns.length);

  // Sheet 2: findings
  const s2 = workbook.addWorksheet('Hallazgos');
  s2.columns = [
    { header: 'Código', key: 'code', width: 12 },
    { header: 'Severidad', key: 'sev', width: 12 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Título', key: 'title', width: 42 },
    { header: 'Cláusula', key: 'clause', width: 14 },
    { header: 'Requisito vinculado', key: 'req', width: 36 },
    { header: 'Control vinculado', key: 'ctrl', width: 36 },
    { header: 'NC asociada', key: 'nc', width: 20 },
    { header: 'Detalle', key: 'detail', width: 50 },
    { header: 'Recomendación', key: 'rec', width: 50 },
    { header: 'Respuesta gerencial', key: 'resp', width: 50 },
    { header: 'Fecha respuesta', key: 'due', width: 14 },
    { header: 'Evidencia cierre', key: 'ev', width: 40 },
  ];

  const severityColor: Record<string, string> = {
    critical: 'FFFECACA',
    major: 'FFFED7AA',
    minor: 'FFFEF3C7',
    observation: 'FFE0E7FF',
  };

  for (const f of (findings ?? []) as unknown as Finding[]) {
    const reqLabel = f.framework_requirements
      ? `${f.framework_requirements.frameworks?.name ?? ''} · ${f.framework_requirements.code} ${f.framework_requirements.name}`
      : '';
    const ctrlLabel = f.controls ? `${f.controls.code} — ${f.controls.name}` : '';
    const ncLabel = f.nonconformities ? `${f.nonconformities.code}` : '';
    const row = s2.addRow({
      code: f.code,
      sev: f.severity,
      status: labelFindingStatus(f.status),
      title: f.title,
      clause: f.clause_reference ?? '',
      req: reqLabel,
      ctrl: ctrlLabel,
      nc: ncLabel,
      detail: f.finding_details ?? f.description ?? '',
      rec: f.auditor_recommendation ?? '',
      resp: f.management_response ?? '',
      due: fmt(f.response_due_date),
      ev: f.closure_evidence ?? '',
    });
    if (severityColor[f.severity]) {
      row.getCell('sev').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: severityColor[f.severity] } };
    }
  }
  styleHeaderRow(s2, 'FFDC2626');
  addTitleBlock(s2, `Hallazgos — ${auditRow.code}`, orgName, s2.columns.length);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `bc-trust-audit-${auditRow.code}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer, { headers: xlsxResponseHeaders(filename) });
}

function fmt(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

function labelFindingStatus(s: string): string {
  const map: Record<string, string> = {
    open: 'Abierto',
    action_planned: 'Acción planificada',
    in_remediation: 'En remediación',
    closed: 'Cerrado',
    accepted: 'Aceptado',
  };
  return map[s] ?? s;
}
