import { requireOrg } from '@/shared/lib/get-org';
import { getAuditById, getEnrichedAuditFindings } from '@/features/audits/services/auditService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, AlertTriangle, CheckSquare, Shield, FileWarning } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-700">{value || <span className="text-slate-400">-</span>}</div>
    </div>
  );
}

export default async function AuditDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const [audit, findings] = await Promise.all([
    getAuditById(id),
    getEnrichedAuditFindings(id),
  ]);

  if (!audit) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/audits" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={audit.title}
          description={`${audit.code} | ${audit.audit_type?.replace(/_/g, ' ')}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={audit.status} />
        <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-500 border border-slate-200 capitalize">
          {audit.audit_type?.replace(/_/g, ' ')}
        </span>
        {audit.year && (
          <span className="font-mono text-xs text-slate-500">Año {audit.year}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{audit.code}</span>} />
            <DetailRow label="Tipo" value={audit.audit_type?.replace(/_/g, ' ')} />
            <DetailRow label="Estado" value={<StatusBadge status={audit.status} />} />
            <DetailRow label="Departamentos" value={audit.departments && audit.departments.length > 0 ? audit.departments.join(', ') : null} />
            <DetailRow label="Entidad certificadora" value={audit.certification_body} />
            <DetailRow label="Nº certificado" value={audit.certificate_number ? <span className="font-mono">{audit.certificate_number}</span> : null} />
            {audit.certificate_expiry && (
              <DetailRow label="Vence certificado" value={
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(audit.certificate_expiry).toLocaleDateString('es-CO', { dateStyle: 'long' })}
                </span>
              } />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Planificacion</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Inicio planificado" value={audit.planned_start ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(audit.planned_start).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fin planificado" value={audit.planned_end ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(audit.planned_end).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Inicio real" value={audit.actual_start ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(audit.actual_start).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fin real" value={audit.actual_end ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(audit.actual_end).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
          </div>
        </div>
      </div>

      {audit.scope_description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Alcance</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{audit.scope_description}</p>
        </div>
      )}

      {audit.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{audit.description}</p>
        </div>
      )}

      {/* Findings - enriched with requirement/control/NC links */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Hallazgos</h2>
          <span className="text-xs text-slate-400 ml-1">({findings.length})</span>
        </div>
        {findings.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No hay hallazgos registrados para esta auditoría.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {findings.map((finding) => (
              <div key={finding.id} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-semibold text-sky-600 w-24 flex-shrink-0">{finding.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{finding.title}</p>
                    {finding.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{finding.description}</p>
                    )}
                    {finding.clause_reference && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Cláusula: <span className="font-mono">{finding.clause_reference}</span>
                      </p>
                    )}

                    {/* GRC integration links */}
                    {(finding.requirement_code || finding.control_code || finding.nonconformity_code) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {finding.requirement_code && (
                          <Link
                            href="/compliance"
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckSquare className="w-3 h-3" />
                            {finding.requirement_framework ? `${finding.requirement_framework}: ` : ''}{finding.requirement_code}
                          </Link>
                        )}
                        {finding.control_code && (
                          <Link
                            href="/controls"
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                          >
                            <Shield className="w-3 h-3" />
                            {finding.control_code}
                          </Link>
                        )}
                        {finding.nonconformity_code && (
                          <Link
                            href="/nonconformities"
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                          >
                            <FileWarning className="w-3 h-3" />
                            {finding.nonconformity_code}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={finding.severity} />
                    <StatusBadge status={finding.status} />
                  </div>
                </div>
                {finding.auditor_recommendation && (
                  <p className="mt-2 ml-24 text-xs text-slate-600 bg-slate-50 rounded-md p-2 border border-slate-100">
                    <span className="font-semibold text-slate-500">Recomendación: </span>
                    {finding.auditor_recommendation}
                  </p>
                )}
                {finding.response_due_date && (
                  <p className="mt-1 ml-24 text-[11px] text-amber-600">
                    Respuesta debida: {new Date(finding.response_due_date).toLocaleDateString('es-CO')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
