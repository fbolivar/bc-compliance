'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { RelatedEntityPanel } from '@/features/compliance/components/RelatedEntityPanel';
import {
  linkTreatmentPlanToRisk,
  unlinkTreatmentPlanFromRisk,
} from '@/features/compliance/actions/mappingActions';
import type { RiskTreatmentPlan, AvailableTreatmentPlan } from '@/features/compliance/services/relationshipService';

interface Props {
  riskId: string;
  items: RiskTreatmentPlan[];
  availablePlans: AvailableTreatmentPlan[];
}

export function RiskTreatmentPlansPanel({ riskId, items, availablePlans }: Props) {
  return (
    <RelatedEntityPanel
      title="Planes de Tratamiento"
      icon={<ClipboardList className="w-4 h-4 text-indigo-500" />}
      items={items.map((p) => ({ ...p, entity_id: p.treatment_plan_id }))}
      entityBasePath="/risks/treatment-plans"
      emptyMessage="Este riesgo aún no está incluido en planes de tratamiento."
      addButtonLabel="Agregar plan"
      modalTitle="Incluir riesgo en plan de tratamiento"
      optionGroupLabel="Plan de tratamiento"
      options={availablePlans.map((p) => ({
        id: p.id,
        label: `${p.code} — ${p.title}`,
        sublabel: p.status,
      }))}
      onAdd={async (planId) => {
        const res = await linkTreatmentPlanToRisk({ treatmentPlanId: planId, riskId });
        return { error: res.error };
      }}
      onRemove={async (mappingId) => {
        const res = await unlinkTreatmentPlanFromRisk(mappingId);
        return { error: res.error };
      }}
      confirmRemoveMessage="¿Quitar este plan de tratamiento?"
      columns={[
        {
          key: 'code',
          label: 'Código',
          render: (p) => {
            const item = p as unknown as RiskTreatmentPlan;
            return (
              <Link
                href="/risks/treatment-plans"
                className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline"
              >
                {item.code}
              </Link>
            );
          },
        },
        {
          key: 'title',
          label: 'Plan',
          render: (p) => (
            <span className="text-sm text-slate-700">{(p as unknown as RiskTreatmentPlan).title}</span>
          ),
        },
        {
          key: 'status',
          label: 'Estado',
          render: (p) => <StatusBadge status={(p as unknown as RiskTreatmentPlan).status} />,
        },
        {
          key: 'target',
          label: 'Fecha objetivo',
          render: (p) => {
            const item = p as unknown as RiskTreatmentPlan;
            return item.target_date ? (
              <span className="text-xs text-slate-600">
                {new Date(item.target_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            );
          },
        },
      ]}
    />
  );
}
