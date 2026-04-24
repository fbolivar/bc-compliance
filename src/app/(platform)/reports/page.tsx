import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { Download, FileText, CheckSquare, AlertTriangle, BarChart3, Link2, TrendingUp, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Audit programs list for the per-audit report picker
  const { data: audits } = await supabase
    .from('audit_programs')
    .select('id, code, title, status, year')
    .eq('organization_id', orgId)
    .order('year', { ascending: false })
    .order('code');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes"
        description="Genera reportes Excel listos para auditoría, dirección y entes reguladores."
      />

      {/* Executive PDF download */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Reporte Ejecutivo GRC (PDF)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              KPIs de riesgos por zona, incidentes, controles y no conformidades. Listo para presentar a la dirección.
            </p>
          </div>
        </div>
        <a
          href="/api/reports/executive"
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCard
          title="Declaración de Aplicabilidad (SOA)"
          description="Documento formal SOA con todos los requisitos y su estado de aplicabilidad, implementación, justificación y controles vinculados. Formato ISO 27001:2022."
          icon={<CheckSquare className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50 border-emerald-200"
          href="/api/reports/soa"
          badge="Excel"
        />

        <ReportCard
          title="Análisis de Brechas Multi-Framework"
          description="Consolida requisitos no implementados o parciales en todos los frameworks activos, con acciones priorizadas por nivel de criticidad."
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50 border-amber-200"
          href="/api/reports/gap-analysis"
          badge="Excel"
        />

        <ReportCard
          title="Resumen Ejecutivo de Cumplimiento"
          description="KPIs consolidados: % por framework, riesgos críticos, incidentes del periodo, efectividad de controles y estado general del SGSI."
          icon={<TrendingUp className="w-5 h-5 text-sky-600" />}
          bg="bg-sky-50 border-sky-200"
          href="/api/reports/executive-summary"
          badge="Excel"
        />

        <ReportCard
          title="Informe Ejecutivo SGSI (Mensual)"
          description="Documento PDF profesional con tendencia 30 días, postura MSPI, ciclo PHVA, brechas críticas y recomendaciones estratégicas. Listo para presentar a la dirección."
          icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
          bg="bg-rose-50 border-rose-200"
          href="/api/reports/executive-monthly"
          badge="PDF"
        />

        <ReportCard
          title="Mapeos Completos de Integración"
          description="Exporta todos los vínculos control-riesgo, control-requisito y cross-framework de la organización. Útil para auditoría externa."
          icon={<Link2 className="w-5 h-5 text-indigo-600" />}
          bg="bg-indigo-50 border-indigo-200"
          href="/api/compliance/mappings-export"
          badge="Excel"
        />

        <ReportCard
          title="Informe de Formación y Concienciación"
          description="Registro completo de campañas, sesiones y participantes con estado de completitud, calificaciones y tasa de aprobación. ISO 27001:2022 A.6.3."
          icon={<GraduationCap className="w-5 h-5 text-teal-600" />}
          bg="bg-teal-50 border-teal-200"
          href="/api/reports/training"
          badge="Excel"
        />
      </div>

      {/* Per-audit reports */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Informes por Auditoría
          </h2>
        </div>

        {(audits?.length ?? 0) === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No hay programas de auditoría registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {audits?.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-sky-600">{a.code}</span>
                    {a.year && <span className="text-[11px] text-slate-400">Año {a.year}</span>}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 capitalize">
                      {a.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{a.title}</p>
                </div>
                <a
                  href={`/api/reports/audit/${a.id}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
        <BarChart3 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Los informes se generan en tiempo real con los datos actuales de la organización.
          Formato Excel compatible con Office / LibreOffice / Google Sheets. Todos los reportes
          respetan el contexto multi-tenant vía RLS.
        </p>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  description,
  icon,
  bg,
  href,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
  href: string;
  badge: string;
}) {
  return (
    <a
      href={href}
      className={`block rounded-xl border p-5 shadow-sm hover:shadow-md transition-all ${bg}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200 rounded px-1.5 py-0.5 uppercase tracking-wider">
            {badge}
          </span>
          <Download className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
    </a>
  );
}
