'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bug } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { RelatedEntityPanel } from '@/features/compliance/components/RelatedEntityPanel';
import {
  linkRiskToVulnerability,
  unlinkRiskFromVulnerability,
} from '@/features/compliance/actions/mappingActions';
import type { RelatedVulnerability, AvailableVulnerability } from '@/features/compliance/services/relationshipService';

interface Props {
  riskId: string;
  items: RelatedVulnerability[];
  availableVulns: AvailableVulnerability[];
}

export function RiskVulnerabilitiesPanel({ riskId, items, availableVulns }: Props) {
  const [contribution, setContribution] = useState(50);
  const [notes, setNotes] = useState('');

  return (
    <RelatedEntityPanel
      title="Vulnerabilidades Relacionadas"
      icon={<Bug className="w-4 h-4 text-amber-500" />}
      items={items.map((v) => ({ ...v, entity_id: v.vulnerability_id }))}
      entityBasePath="/vulnerabilities"
      emptyMessage="Este riesgo aún no tiene vulnerabilidades asociadas."
      addButtonLabel="Agregar vulnerabilidad"
      modalTitle="Vincular vulnerabilidad a riesgo"
      optionGroupLabel="Vulnerabilidad"
      options={availableVulns.map((v) => ({
        id: v.id,
        label: `${v.code} — ${v.title}`,
        sublabel: v.severity,
      }))}
      onModalOpen={() => {
        setContribution(50);
        setNotes('');
      }}
      onAdd={async (vulnId) => {
        const res = await linkRiskToVulnerability({
          riskId,
          vulnerabilityId: vulnId,
          contributionFactor: contribution,
          notes,
        });
        return { error: res.error };
      }}
      onRemove={async (mappingId) => {
        const res = await unlinkRiskFromVulnerability(mappingId);
        return { error: res.error };
      }}
      confirmRemoveMessage="¿Quitar esta vulnerabilidad del riesgo?"
      columns={[
        {
          key: 'code',
          label: 'Código',
          render: (v) => {
            const item = v as unknown as RelatedVulnerability;
            return (
              <Link
                href={`/vulnerabilities/${item.vulnerability_id}`}
                className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline"
              >
                {item.code}
              </Link>
            );
          },
        },
        {
          key: 'title',
          label: 'Vulnerabilidad',
          render: (v) => {
            const item = v as unknown as RelatedVulnerability;
            return (
              <div>
                <p className="text-sm text-slate-700">{item.title}</p>
                {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
              </div>
            );
          },
        },
        {
          key: 'severity',
          label: 'Severidad',
          render: (v) => <StatusBadge status={(v as unknown as RelatedVulnerability).severity} />,
        },
        {
          key: 'cvss',
          label: 'CVSS',
          align: 'right',
          render: (v) => {
            const item = v as unknown as RelatedVulnerability;
            return item.cvss_base_score !== null ? (
              <span className="font-mono text-xs text-slate-600">{item.cvss_base_score}</span>
            ) : (
              <span className="text-slate-300">—</span>
            );
          },
        },
        {
          key: 'contribution',
          label: 'Contribución',
          align: 'right',
          render: (v) => {
            const item = v as unknown as RelatedVulnerability;
            return (
              <div className="inline-flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      item.contribution_factor >= 70 ? 'bg-rose-500' :
                      item.contribution_factor >= 40 ? 'bg-amber-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${item.contribution_factor}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-slate-600 w-10 text-right">
                  {item.contribution_factor}%
                </span>
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
              placeholder="Cómo esta vulnerabilidad contribuye al riesgo..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
        </>
      }
    />
  );
}
