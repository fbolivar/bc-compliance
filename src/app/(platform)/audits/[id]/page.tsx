import { requireOrg } from '@/shared/lib/get-org';
import { getAuditById, getAuditFindings } from '@/features/audits/services/auditService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-800/50 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-200">{value || <span className="text-slate-600">-</span>}</div>
    </div>
  );
}

export default async function AuditDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const audit = await getAuditById(id);

  if (!audit) notFound();

  const findings = await getAuditFindings(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/audits" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={audit.name}
          description={`${audit.code} | ${audit.audit_type?.replace(/_/g, ' ')}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={audit.status} />
        <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 capitalize">
          {audit.audit_type?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-800/50">
            <DetailRow label="Codigo" value={<span className="font-mono text-cyan-400">{audit.code}</span>} />
            <DetailRow label="Tipo" value={audit.audit_type?.replace(/_/g, ' ')} />
            <DetailRow label="Estado" value={<StatusBadge status={audit.status} />} />
            <DetailRow label="Auditor Lider" value={audit.lead_auditor} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Planificacion</h2>
          <div className="divide-y divide-slate-800/50">
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
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(audit.actual_start).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fin real" value={audit.actual_end ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(audit.actual_end).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
          </div>
        </div>
      </div>

      {audit.scope && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Alcance</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{audit.scope}</p>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Hallazgos ({findings.length})</h2>
          </div>
          <div className="divide-y divide-slate-800/50">
            {findings.map((finding) => (
              <div key={finding.id} className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs text-cyan-400 w-24 shrink-0">{finding.code}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{finding.title}</p>
                    {finding.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{finding.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={finding.severity} />
                    <StatusBadge status={finding.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
