import { requireOrg } from '@/shared/lib/get-org';
import { getNCById } from '@/features/nonconformities/services/ncService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

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

export default async function NCDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const nc = await getNCById(id);

  if (!nc) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/nonconformities" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={nc.title}
          description={nc.code}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={nc.type} />
        <StatusBadge status={nc.severity} />
        <StatusBadge status={nc.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-800/50">
            <DetailRow label="Codigo" value={<span className="font-mono text-cyan-400">{nc.code}</span>} />
            <DetailRow label="Tipo" value={<StatusBadge status={nc.type} />} />
            <DetailRow label="Severidad" value={<StatusBadge status={nc.severity} />} />
            <DetailRow label="Estado" value={<StatusBadge status={nc.status} />} />
            <DetailRow label="Fuente" value={nc.source?.replace(/_/g, ' ')} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Fechas</h2>
          <div className="divide-y divide-slate-800/50">
            <DetailRow label="Fecha de deteccion" value={nc.detected_date ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(nc.detected_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fecha limite" value={nc.due_date ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(nc.due_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fecha de cierre" value={nc.closure_date ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(nc.closure_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Creado" value={new Date(nc.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          </div>
        </div>
      </div>

      {nc.description && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{nc.description}</p>
        </div>
      )}

      {nc.root_cause && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Causa Raiz</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{nc.root_cause}</p>
        </div>
      )}

      {(nc.corrective_action || nc.preventive_action) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {nc.corrective_action && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Accion Correctiva</h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{nc.corrective_action}</p>
            </div>
          )}
          {nc.preventive_action && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Accion Preventiva</h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{nc.preventive_action}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
