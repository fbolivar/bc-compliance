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
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cronologia</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Fecha de deteccion" value={incident.detection_date ? new Date(incident.detection_date).toLocaleDateString('es-CO', { dateStyle: 'long' }) : null} />
            <DetailRow label="Fecha de contencion" value={incident.containment_date ? new Date(incident.containment_date).toLocaleDateString('es-CO', { dateStyle: 'long' }) : null} />
            <DetailRow label="Fecha de resolucion" value={incident.resolution_date ? new Date(incident.resolution_date).toLocaleDateString('es-CO', { dateStyle: 'long' }) : null} />
            <DetailRow label="Creado" value={new Date(incident.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          </div>
        </div>
      </div>

      {incident.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
        </div>
      )}

      {incident.impact_description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Impacto</h2>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{incident.impact_description}</p>
        </div>
      )}

      {incident.root_cause && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Causa Raiz</h2>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{incident.root_cause}</p>
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
