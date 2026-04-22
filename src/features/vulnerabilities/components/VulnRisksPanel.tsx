'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { RelatedEntityPanel } from '@/features/compliance/components/RelatedEntityPanel';
import {
  linkRiskToVulnerability,
  unlinkRiskFromVulnerability,
} from '@/features/compliance/actions/mappingActions';
import type { RelatedRisk, AvailableRiskOption } from '@/features/compliance/services/relationshipService';

interface Props {
  vulnerabilityId: string;
  items: RelatedRisk[];
  availableRisks: AvailableRiskOption[];
}

export function VulnRisksPanel({ vulnerabilityId, items, availableRisks }: Props) {
  const [contribution, setContribution] = useState(50);
  const [notes, setNotes] = useState('');

  return (
    <RelatedEntityPanel
      title="Riesgos Asociados"
      icon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
      items={items.map((r) => ({ ...r, entity_id: r.risk_id }))}
      entityBasePath="/risks"
      emptyMessage="Esta vulnerabilidad aún no está vinculada a riesgos."
      addButtonLabel="Agregar riesgo"
      modalTitle="Vincular vulnerabilidad a riesgo"
      optionGroupLabel="Riesgo"
      options={availableRisks.map((r) => ({
        id: r.id,
        label: `${r.code} — ${r.name}`,
        sublabel: r.risk_level_residual,
      }))}
      onModalOpen={() => {
        setContribution(50);
        setNotes('');
      }}
      onAdd={async (riskId) => {
        const res = await linkRiskToVulnerability({
          riskId,
          vulnerabilityId,
          contributionFactor: contribution,
          notes,
        });
        return { error: res.error };
      }}
      onRemove={async (mappingId) => {
        const res = await unlinkRiskFromVulnerability(mappingId);
        return { error: res.error };
      }}
      confirmRemoveMessage="¿Desvincular este riesgo de la vulnerabilidad?"
      columns={[
        {
          key: 'code',
          label: 'Código',
          render: (r) => {
            const item = r as unknown as RelatedRisk;
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
          label: 'Riesgo',
          render: (r) => <span className="text-sm text-slate-700">{(r as unknown as RelatedRisk).name}</span>,
        },
        {
          key: 'residual',
          label: 'Residual',
          render: (r) => {
            const item = r as unknown as RelatedRisk;
            return (
              <div className="flex items-center gap-2">
                <StatusBadge status={item.risk_level_residual} />
                <span className="font-mono text-xs text-slate-500">
                  {Number(item.risk_residual).toFixed(1)}
                </span>
              </div>
            );
          },
        },
        {
          key: 'contribution',
          label: 'Contribución',
          align: 'right',
          render: (r) => {
            const item = r as unknown as RelatedRisk;
            const c = item.contribution_factor ?? 0;
            return (
              <div className="inline-flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c >= 70 ? 'bg-rose-500' : c >= 40 ? 'bg-amber-500' : 'bg-emerald-400'}`}
                    style={{ width: `${c}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-slate-600 w-10 text-right">{c}%</span>
              </div>
            );
          },
        },
      ]}
      extraModalFields={
        <>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Factor de contribución al riesgo (%)
              <span className="ml-2 font-mono text-sky-600">{contribution}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={contribution}
              onChange={(e) => setContribution(Number(e.target.value))}
              aria-label="Factor de contribución"
              className="w-full accent-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
        </>
      }
    />
  );
}
