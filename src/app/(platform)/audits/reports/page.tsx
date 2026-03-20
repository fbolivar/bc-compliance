import { requireOrg } from '@/shared/lib/get-org';
import { getAudits } from '@/features/audits/services/auditService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FileText, Download } from 'lucide-react';
import Link from 'next/link';

const REPORT_TEMPLATES = [
  {
    id: 'iso27001',
    name: 'Informe ISO 27001',
    description: 'Informe de cumplimiento para auditoria de certificacion ISO 27001:2022',
    icon: '📋',
    format: 'PDF',
  },
  {
    id: 'soa',
    name: 'Declaracion de Aplicabilidad',
    description: 'SOA completo con estado de todos los controles Anexo A',
    icon: '📄',
    format: 'PDF/Excel',
  },
  {
    id: 'risk-assessment',
    name: 'Informe de Evaluacion de Riesgos',
    description: 'Reporte MAGERIT con riesgos identificados y planes de tratamiento',
    icon: '⚠️',
    format: 'PDF',
  },
  {
    id: 'vulnerability',
    name: 'Informe de Vulnerabilidades',
    description: 'Estado de vulnerabilidades y progreso de remediacion',
    icon: '🔍',
    format: 'PDF/Excel',
  },
  {
    id: 'gdpr',
    name: 'Informe GDPR / Ley 1581',
    description: 'Cumplimiento de proteccion de datos personales',
    icon: '🔒',
    format: 'PDF',
  },
  {
    id: 'executive',
    name: 'Resumen Ejecutivo',
    description: 'Dashboard de cumplimiento para presentacion a direccion',
    icon: '📊',
    format: 'PDF',
  },
];

export default async function AuditReportsPage() {
  const { orgId } = await requireOrg();
  const completedAudits = await getAudits(orgId, { pageSize: 10 }, { status: 'completed' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generacion de Informes"
        description="Informes automaticos para certificadoras, reguladores y direccion"
      />

      {/* Report Templates */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Plantillas de Informes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{template.icon}</span>
                <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 border border-slate-700 rounded font-mono">
                  {template.format}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{template.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{template.description}</p>
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-500 border border-slate-800 rounded-lg cursor-not-allowed"
                title="Proximamente"
              >
                <Download className="w-3.5 h-3.5" />
                Generar (Proximamente)
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Audits with Reports */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informes de Auditorias Completadas</h2>
        {completedAudits.data.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 py-12 text-center">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No hay auditorias completadas</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="divide-y divide-slate-800/50">
              {completedAudits.data.map((audit) => (
                <div key={audit.id} className="px-4 py-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-cyan-400">{audit.code}</span>
                        <StatusBadge status={audit.status} />
                      </div>
                      <p className="text-sm font-medium text-slate-200">{audit.name}</p>
                      <p className="text-xs text-slate-500">
                        {audit.actual_end ? new Date(audit.actual_end).toLocaleDateString('es-CO', { dateStyle: 'long' }) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {audit.report_url ? (
                        <a
                          href={audit.report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Descargar
                        </a>
                      ) : (
                        <Link
                          href={`/audits/${audit.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                        >
                          Ver Auditoria
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
