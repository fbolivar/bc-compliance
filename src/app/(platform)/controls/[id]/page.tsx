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

function EffectivenessBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-400';
  const textColor = value >= 80 ? 'text-emerald-600' : value >= 50 ? 'text-amber-600' : 'text-rose-600';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[140px]">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`font-mono text-xs ${textColor}`}>{value}%</span>
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
        <Link
          href={`/controls/${id}/edit`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors ml-auto shrink-0"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={control.status} />
        {control.is_key_control && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
            Control clave
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{control.code}</span>} />
            <DetailRow label="Tipo" value={control.control_type?.replace(/_/g, ' ')} />
            <DetailRow label="Naturaleza" value={control.control_nature?.replace(/_/g, ' ')} />
            <DetailRow label="Estado" value={<StatusBadge status={control.status} />} />
            <DetailRow label="Departamento" value={control.department} />
            <DetailRow label="Frecuencia de ejecucion" value={control.execution_frequency?.replace(/_/g, ' ')} />
            <DetailRow label="Nivel de automatizacion" value={control.automation_level?.replace(/_/g, ' ')} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Efectividad y Fechas</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow
              label="Efectividad de diseño"
              value={control.design_effectiveness !== null ? <EffectivenessBar value={control.design_effectiveness} /> : null}
            />
            <DetailRow
              label="Efectividad operativa"
              value={control.operating_effectiveness !== null ? <EffectivenessBar value={control.operating_effectiveness} /> : null}
            />
            <DetailRow
              label="Efectividad general"
              value={control.overall_effectiveness !== null ? <EffectivenessBar value={control.overall_effectiveness} /> : null}
            />
            <DetailRow label="Ultima prueba" value={control.last_tested_at ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(control.last_tested_at).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Proxima revision" value={control.next_review_date ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(control.next_review_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Implementado" value={control.implementation_date ? new Date(control.implementation_date).toLocaleDateString('es-CO', { dateStyle: 'long' }) : null} />
          </div>
        </div>
      </div>

      {control.objective && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Objetivo</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{control.objective}</p>
        </div>
      )}

      {control.implementation_notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Notas de implementacion</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{control.implementation_notes}</p>
        </div>
      )}

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
