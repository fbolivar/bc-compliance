'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { RelatedEntityPanel } from '@/features/compliance/components/RelatedEntityPanel';
import {
  linkIncidentToRisk,
  unlinkIncidentFromRisk,
} from '@/features/compliance/actions/mappingActions';
import type { IncidentRiskItem } from '@/features/compliance/services/relationshipService';

interface AvailableRisk {
  id: string;
  code: string;
  name: string;
  risk_level_residual: string;
}

interface Props {
  incidentId: string;
  items: IncidentRiskItem[];
  availableRisks: AvailableRisk[];
}

export function IncidentRisksPanel({ incidentId, items, availableRisks }: Props) {
  const [notes, setNotes] = useState('');

  return (
    <RelatedEntityPanel
      title="Riesgos Materializados"
      icon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
      items={items.map((r) => ({ ...r, entity_id: r.risk_id }))}
      entityBasePath="/risks"
      emptyMessage="Este incidente aún no está vinculado a riesgos."
      addButtonLabel="Vincular riesgo"
      modalTitle="Vincular riesgo a incidente"
      optionGroupLabel="Riesgo"
      options={availableRisks.map((r) => ({
        id: r.id,
        label: `${r.code} — ${r.name}`,
        sublabel: r.risk_level_residual,
      }))}
      onModalOpen={() => setNotes('')}
      onAdd={async (riskId) => {
        const res = await linkIncidentToRisk({ incidentId, riskId, notes });
        return { error: res.error };
      }}
      onRemove={async (mappingId) => {
        const res = await unlinkIncidentFromRisk(mappingId);
        return { error: res.error };
      }}
      confirmRemoveMessage="¿Desvincular este riesgo del incidente?"
      columns={[
        {
          key: 'code',
          label: 'Código',
          render: (r) => {
            const item = r as unknown as IncidentRiskItem;
            return (
              <Link
                href={`/risks/${item.risk_id}`}
                className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline"
              >
                {item.code}
              </Link>
            );
          },
        },
        {
          key: 'name',
          label: 'Escenario de riesgo',
          render: (r) => {
            const item = r as unknown as IncidentRiskItem;
            return (
              <div>
                <p className="text-sm text-slate-700">{item.name}</p>
                {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
              </div>
            );
          },
        },
        {
          key: 'residual',
          label: 'Residual',
          render: (r) => <StatusBadge status={(r as unknown as IncidentRiskItem).risk_level_residual} />,
        },
      ]}
      extraModalFields={
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Cómo se materializó este riesgo..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>
      }
    />
  );
}
