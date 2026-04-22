import { requireOrg } from '@/shared/lib/get-org';
import {
  getControlById,
  getRisksForControl,
  getRequirementsForControl,
  getAvailableRisksForControl,
  getAvailableRequirementsForControl,
} from '@/features/controls/services/controlService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { MitigatedRisksPanel } from '@/features/controls/components/MitigatedRisksPanel';
import { CoveredRequirementsPanel } from '@/features/controls/components/CoveredRequirementsPanel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

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

export default async function ControlDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [control, mitigatedRisks, coveredRequirements, availableRisks, availableRequirements] =
    await Promise.all([
      getControlById(id),
      getRisksForControl(id),
      getRequirementsForControl(id),
      getAvailableRisksForControl(orgId, id),
      getAvailableRequirementsForControl(id),
    ]);

  if (!control) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/controls" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={control.name}
          description={control.code}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={control.status} />
        {control.effectiveness && <StatusBadge status={control.effectiveness} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{control.code}</span>} />
            <DetailRow label="Tipo" value={control.control_type?.replace(/_/g, ' ')} />
            <DetailRow label="Categoria" value={control.category} />
            <DetailRow label="Estado" value={<StatusBadge status={control.status} />} />
            <DetailRow label="Efectividad" value={control.effectiveness ? <StatusBadge status={control.effectiveness} /> : null} />
            <DetailRow label="Responsable" value={control.owner} />
            <DetailRow label="Frecuencia" value={control.frequency} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Revision y Fechas</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Ultima revision" value={control.last_review_date ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(control.last_review_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Proxima revision" value={control.next_review_date ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(control.next_review_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Evidencia requerida" value={control.evidence_required ? (
              <span className="text-amber-400">Si</span>
            ) : 'No'} />
            <DetailRow label="Nivel de automatizacion" value={control.automation_level} />
            <DetailRow label="Creado" value={new Date(control.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          </div>
        </div>
      </div>

      {control.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{control.description}</p>
        </div>
      )}

      {/* Riesgos Mitigados - integración Controles ↔ Riesgos */}
      <MitigatedRisksPanel
        controlId={control.id}
        mitigatedRisks={mitigatedRisks}
        availableRisks={availableRisks}
      />

      {/* Requisitos Cubiertos - integración Controles ↔ Compliance */}
      <CoveredRequirementsPanel
        controlId={control.id}
        coveredRequirements={coveredRequirements}
        availableRequirements={availableRequirements}
      />
    </div>
  );
}
