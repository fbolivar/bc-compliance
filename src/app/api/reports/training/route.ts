import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { styleHeaderRow, addTitleBlock, xlsxResponseHeaders } from '@/features/reporting/services/xlsxHelpers';

export const dynamic = 'force-dynamic';

const STATUS_ES: Record<string, string> = {
  pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completado',
  failed: 'Reprobado', excused: 'Excusado',
};
const TYPE_ES: Record<string, string> = {
  awareness: 'Concienciación', compliance: 'Cumplimiento', technical: 'Técnica',
  onboarding: 'Inducción', phishing_simulation: 'Sim. Phishing',
};
const FORMAT_ES: Record<string, string> = {
  in_person: 'Presencial', online: 'Online', hybrid: 'Híbrido',
  video: 'Video', document: 'Documento', phishing: 'Phishing',
};

export async function GET() {
  const { orgId, organization } = await requireOrg();
  const supabase = await createClient();
  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';

  const [{ data: campaigns }, { data: sessions }, { data: enrollments }] = await Promise.all([
    supabase.from('training_campaigns').select('*').eq('organization_id', orgId).order('created_at'),
    supabase.from('training_sessions').select('*, campaign:training_campaigns(title)').eq('organization_id', orgId).order('scheduled_at'),
    supabase.from('training_enrollments').select('*, session:training_sessions(title, format)').eq('organization_id', orgId).order('created_at'),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BC Trust GRC';
  wb.created = new Date();

  // ── Sheet 1: Resumen ──────────────────────────────────────────────────────────
  const summary = wb.addWorksheet('Resumen');
  summary.columns = [
    { key: 'metric', width: 40 },
    { key: 'value', width: 20 },
  ];
  summary.addRow(['Métrica', 'Valor']);
  styleHeaderRow(summary);
  const total = enrollments?.length ?? 0;
  const completed = (enrollments ?? []).filter(e => e.status === 'completed').length;
  const failed = (enrollments ?? []).filter(e => e.status === 'failed').length;
  const pending = (enrollments ?? []).filter(e => e.status === 'pending' || e.status === 'in_progress').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgScore = total > 0
    ? Math.round((enrollments ?? []).filter(e => e.score != null).reduce((s, e) => s + (e.score ?? 0), 0) /
        Math.max(1, (enrollments ?? []).filter(e => e.score != null).length))
    : 0;

  [
    ['Total campañas', campaigns?.length ?? 0],
    ['Campañas activas', (campaigns ?? []).filter(c => c.status === 'active').length],
    ['Total sesiones', sessions?.length ?? 0],
    ['Total participantes', total],
    ['Completados', completed],
    ['Reprobados', failed],
    ['Pendientes / En progreso', pending],
    ['Tasa de completitud', `${rate}%`],
    ['Calificación promedio', avgScore > 0 ? `${avgScore}%` : 'N/A'],
  ].forEach(([m, v]) => summary.addRow([m, v]));

  addTitleBlock(summary, `Informe de Formación y Concienciación`, orgName, 2);
  summary.getColumn('value').alignment = { horizontal: 'right' };

  // ── Sheet 2: Campañas ─────────────────────────────────────────────────────────
  const campSheet = wb.addWorksheet('Campañas');
  campSheet.columns = [
    { header: 'Título', key: 'title', width: 36 },
    { header: 'Tipo', key: 'type', width: 20 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Obligatoria', key: 'mandatory', width: 14 },
    { header: 'Audiencia', key: 'target_audience', width: 28 },
    { header: 'Fecha límite', key: 'due_date', width: 16 },
    { header: 'Cláusula ISO', key: 'iso_clause', width: 14 },
  ];
  styleHeaderRow(campSheet);
  for (const c of campaigns ?? []) {
    campSheet.addRow({
      title: c.title,
      type: TYPE_ES[c.type] ?? c.type,
      status: STATUS_ES[c.status] ?? c.status,
      mandatory: c.mandatory ? 'Sí' : 'No',
      target_audience: c.target_audience ?? '',
      due_date: c.due_date ?? '',
      iso_clause: c.iso_clause ?? '',
    });
  }
  addTitleBlock(campSheet, 'Campañas de Formación', orgName, 7);

  // ── Sheet 3: Sesiones ─────────────────────────────────────────────────────────
  const sessSheet = wb.addWorksheet('Sesiones');
  sessSheet.columns = [
    { header: 'Sesión', key: 'title', width: 36 },
    { header: 'Campaña', key: 'campaign', width: 30 },
    { header: 'Formato', key: 'format', width: 16 },
    { header: 'Fecha', key: 'scheduled_at', width: 20 },
    { header: 'Duración (min)', key: 'duration', width: 16 },
    { header: 'Instructor', key: 'trainer', width: 24 },
    { header: 'Nota aprobatoria', key: 'passing_score', width: 18 },
  ];
  styleHeaderRow(sessSheet);
  for (const s of sessions ?? []) {
    const camp = s.campaign as { title?: string } | null;
    sessSheet.addRow({
      title: s.title,
      campaign: camp?.title ?? '',
      format: FORMAT_ES[s.format] ?? s.format,
      scheduled_at: s.scheduled_at ? new Date(s.scheduled_at).toLocaleString('es-CO') : '',
      duration: s.duration_minutes ?? '',
      trainer: s.trainer ?? '',
      passing_score: s.passing_score != null ? `${s.passing_score}%` : '',
    });
  }
  addTitleBlock(sessSheet, 'Sesiones de Formación', orgName, 7);

  // ── Sheet 4: Participantes ───────────────────────────────────────────────────
  const enrollSheet = wb.addWorksheet('Participantes');
  enrollSheet.columns = [
    { header: 'Nombre', key: 'user_name', width: 28 },
    { header: 'Email', key: 'user_email', width: 32 },
    { header: 'Área', key: 'department', width: 20 },
    { header: 'Sesión', key: 'session', width: 32 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Calificación', key: 'score', width: 14 },
    { header: 'Resultado', key: 'result', width: 14 },
    { header: 'Fecha completado', key: 'completed_at', width: 20 },
    { header: 'Fecha vencimiento', key: 'expiry_date', width: 20 },
  ];
  styleHeaderRow(enrollSheet, 'FF10B981');
  for (const e of enrollments ?? []) {
    const sess = e.session as { title?: string } | null;
    const score = e.score;
    enrollSheet.addRow({
      user_name: e.user_name,
      user_email: e.user_email,
      department: e.department ?? '',
      session: sess?.title ?? '',
      status: STATUS_ES[e.status] ?? e.status,
      score: score != null ? `${score}%` : '',
      result: score != null ? (score >= 70 ? 'Aprobado' : 'Reprobado') : '',
      completed_at: e.completed_at ? new Date(e.completed_at).toLocaleDateString('es-CO') : '',
      expiry_date: e.expiry_date ?? '',
    });
    // Color row by status
    const row = enrollSheet.lastRow;
    if (row) {
      const fill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: e.status === 'completed' ? 'FFD1FAE5' : e.status === 'failed' ? 'FFFEE2E2' : 'FFFEFCE8' } };
      row.eachCell(cell => { cell.fill = fill; });
    }
  }
  addTitleBlock(enrollSheet, 'Registro de Participantes', orgName, 9);

  const buffer = await wb.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: xlsxResponseHeaders(`informe-formacion-${today}.xlsx`) as Record<string, string>,
  });
}
