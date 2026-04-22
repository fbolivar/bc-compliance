import { requireOrg } from '@/shared/lib/get-org';
import { getIncidentById, getIncidentTimeline } from '@/features/incidents/services/incidentService';
import {
  getRisksForIncident,
  getAvailableRisksForIncident,
  getAssetsForIncident,
  getAvailableAssetsForIncident,
} from '@/features/compliance/services/relationshipService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { IncidentRisksPanel } from '@/features/incidents/components/IncidentRisksPanel';
import { IncidentAssetsPanel } from '@/features/incidents/components/IncidentAssetsPanel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

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

export default async function IncidentDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [incident, timeline, incidentRisks, availableRisks, incidentAssets, availableAssets] =
    await Promise.all([
      getIncidentById(id),
      getIncidentTimeline(id),
      getRisksForIncident(id),
      getAvailableRisksForIncident(orgId, id),
      getAssetsForIncident(id),
      getAvailableAssetsForIncident(orgId, id),
    ]);

  if (!incident) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/incidents" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={incident.title}
          description={incident.code}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={incident.severity} />
        <StatusBadge status={incident.status} />
        {incident.category && (
          <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-500 border border-slate-200">
            {incident.category.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{incident.code}</span>} />
            <DetailRow label="Severidad" value={<StatusBadge status={incident.severity} />} />
            <DetailRow label="Estado" value={<StatusBadge status={incident.status} />} />
            <DetailRow label="Categoria" value={incident.category?.replace(/_/g, ' ')} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cronologia NIST SP 800-61</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Detectado" value={incident.detected_at ? new Date(incident.detected_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            <DetailRow label="Triaje" value={incident.triaged_at ? new Date(incident.triaged_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            <DetailRow label="Contenido" value={incident.contained_at ? new Date(incident.contained_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            <DetailRow label="Erradicado" value={incident.eradicated_at ? new Date(incident.eradicated_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            <DetailRow label="Recuperado" value={incident.recovered_at ? new Date(incident.recovered_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            <DetailRow label="Cerrado" value={incident.closed_at ? new Date(incident.closed_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
          </div>
        </div>
      </div>

      {/* Impacto y notificación */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Impacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-slate-100">
          <DetailRow label="Usuarios afectados" value={incident.affected_users_count ?? null} />
          <DetailRow label="Impacto financiero" value={incident.financial_impact !== null ? `$${Number(incident.financial_impact).toLocaleString('es-CO')}` : null} />
          <DetailRow label="Brecha de datos" value={incident.data_breach ? <span className="text-rose-600">Sí</span> : <span className="text-emerald-600">No</span>} />
          <DetailRow label="PII expuesta" value={incident.pii_exposed ? <span className="text-rose-600">Sí</span> : <span className="text-emerald-600">No</span>} />
          <DetailRow label="Reputación" value={incident.reputational_impact} />
          <DetailRow label="Requiere notificación" value={incident.requires_notification ? (
            <span className="text-amber-600">Sí{incident.notification_deadline ? ` (vence ${new Date(incident.notification_deadline).toLocaleDateString('es-CO')})` : ''}</span>
          ) : 'No'} />
        </div>
      </div>

      {incident.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
        </div>
      )}

      {incident.root_cause && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Causa Raiz</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{incident.root_cause}</p>
        </div>
      )}

      {(incident.containment_actions || incident.eradication_actions || incident.recovery_actions) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Acciones de Respuesta</h2>
          <div className="space-y-4">
            {incident.containment_actions && (
              <div>
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Contención</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{incident.containment_actions}</p>
              </div>
            )}
            {incident.eradication_actions && (
              <div>
                <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Erradicación</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{incident.eradication_actions}</p>
              </div>
            )}
            {incident.recovery_actions && (
              <div>
                <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Recuperación</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{incident.recovery_actions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {incident.lessons_learned && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Lecciones Aprendidas</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{incident.lessons_learned}</p>
        </div>
      )}

      {/* Integración: Activos afectados */}
      <IncidentAssetsPanel
        incidentId={incident.id}
        items={incidentAssets}
        availableAssets={availableAssets}
      />

      {/* Integración: Riesgos materializados */}
      <IncidentRisksPanel
        incidentId={incident.id}
        items={incidentRisks}
        availableRisks={availableRisks}
      />

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Timeline del Incidente</h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />
            {timeline.map((event) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-sky-500 border-2 border-white" />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500">
                      {new Date(event.occurred_at).toLocaleString('es-CO')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
