import { requireOrg } from '@/shared/lib/get-org';
import {
  getNCById,
  getCapaActionsForNC,
  getNCLinkedEntities,
} from '@/features/nonconformities/services/ncService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Shield, CheckSquare, ClipboardList } from 'lucide-react';

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

export default async function NCDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const nc = await getNCById(id);

  if (!nc) notFound();

  const [capaActions, linked] = await Promise.all([
    getCapaActionsForNC(id),
    getNCLinkedEntities(nc),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/nonconformities" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader title={nc.title} description={nc.code} />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={nc.nc_type} />
        <StatusBadge status={nc.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{nc.code}</span>} />
            <DetailRow label="Tipo" value={<StatusBadge status={nc.nc_type} />} />
            <DetailRow label="Estado" value={<StatusBadge status={nc.status} />} />
            <DetailRow label="Fuente" value={nc.source?.replace(/_/g, ' ')} />
            <DetailRow label="Metodo causa raiz" value={nc.root_cause_method} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Fechas</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Detectado" value={nc.detected_at ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(nc.detected_at).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fecha limite de cierre" value={nc.target_close_date ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(nc.target_close_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Cerrado" value={nc.closed_at ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {new Date(nc.closed_at).toLocaleString('es-CO', { dateStyle: 'medium' })}
              </span>
            ) : null} />
            <DetailRow label="Verificado" value={nc.verified_at ? new Date(nc.verified_at).toLocaleString('es-CO', { dateStyle: 'medium' }) : null} />
            <DetailRow label="Creado" value={new Date(nc.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          </div>
        </div>
      </div>

      {/* Requisito/Control vinculados (GRC integration) */}
      {(linked.requirement || linked.control) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Requisito / Control Vinculado
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {linked.requirement && (
              <Link
                href={`/compliance`}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 uppercase">{linked.requirement.framework_name}</p>
                  <p className="font-mono text-xs text-sky-600">{linked.requirement.code}</p>
                  <p className="text-sm text-slate-700">{linked.requirement.name}</p>
                </div>
              </Link>
            )}
            {linked.control && (
              <Link
                href={`/controls/${linked.control.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Shield className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 uppercase">Control</p>
                  <p className="font-mono text-xs text-sky-600">{linked.control.code}</p>
                  <p className="text-sm text-slate-700">{linked.control.name}</p>
                  <div className="mt-1"><StatusBadge status={linked.control.status} /></div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {nc.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{nc.description}</p>
        </div>
      )}

      {nc.root_cause && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Causa Raiz {nc.root_cause_method && <span className="text-xs font-normal text-slate-400">({nc.root_cause_method})</span>}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{nc.root_cause}</p>
        </div>
      )}

      {/* CAPA actions */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Acciones CAPA
            </h2>
            <span className="text-xs text-slate-400 ml-1">({capaActions.length})</span>
          </div>
        </div>

        {capaActions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No hay acciones correctivas/preventivas registradas.</p>
            <p className="text-xs text-slate-400 mt-1">
              Las acciones CAPA se crean para materializar la remediación de esta no conformidad.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {capaActions.map((a) => (
              <div key={a.id} className="px-6 py-4">
                <div className="flex items-start gap-3 mb-2">
                  <span className="font-mono text-xs font-semibold text-sky-600 w-24 flex-shrink-0">
                    {a.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 leading-snug">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-slate-500 mt-1">{a.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={a.action_type} />
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                <div className="ml-24 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400 uppercase">Vence: </span>
                    {a.due_date ? new Date(a.due_date).toLocaleDateString('es-CO') : '—'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase">Completada: </span>
                    {a.completed_date ? new Date(a.completed_date).toLocaleDateString('es-CO') : '—'}
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase">Efectiva: </span>
                    {a.is_effective === null ? '—' : a.is_effective ? (
                      <span className="text-emerald-600 font-medium">Sí</span>
                    ) : (
                      <span className="text-rose-600 font-medium">No</span>
                    )}
                  </div>
                </div>
                {a.effectiveness_notes && (
                  <p className="ml-24 mt-2 text-xs text-slate-500 italic">
                    Efectividad: {a.effectiveness_notes}
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
