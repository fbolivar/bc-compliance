import { requireOrg } from '@/shared/lib/get-org';
import { getAuditById, getEnrichedAuditFindings } from '@/features/audits/services/auditService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { FindingsPanel } from '@/features/audits/components/FindingsPanel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Pencil } from 'lucide-react';

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
        <Link
          href={`/audits/${audit.id}/edit`}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Link>
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

      <FindingsPanel auditId={audit.id} findings={findings} />
    </div>
  );
}
