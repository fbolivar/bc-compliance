'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Server } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { RelatedEntityPanel } from '@/features/compliance/components/RelatedEntityPanel';
import {
  linkIncidentToAsset,
  unlinkIncidentFromAsset,
} from '@/features/compliance/actions/mappingActions';
import type { IncidentAssetItem } from '@/features/compliance/services/relationshipService';

interface AvailableAsset {
  id: string;
  code: string;
  name: string;
  asset_type: string;
  criticality: string;
}

interface Props {
  incidentId: string;
  items: IncidentAssetItem[];
  availableAssets: AvailableAsset[];
}

export function IncidentAssetsPanel({ incidentId, items, availableAssets }: Props) {
  const [impact, setImpact] = useState('');

  return (
    <RelatedEntityPanel
      title="Activos Afectados"
      icon={<Server className="w-4 h-4 text-sky-500" />}
      items={items.map((a) => ({ ...a, entity_id: a.asset_id }))}
      entityBasePath="/assets"
      emptyMessage="Este incidente aún no tiene activos afectados vinculados."
      addButtonLabel="Agregar activo"
      modalTitle="Vincular activo a incidente"
      optionGroupLabel="Activo"
      options={availableAssets.map((a) => ({
        id: a.id,
        label: `${a.code} — ${a.name}`,
        sublabel: `${a.asset_type} · ${a.criticality}`,
      }))}
      onModalOpen={() => setImpact('')}
      onAdd={async (assetId) => {
        const res = await linkIncidentToAsset({ incidentId, assetId, impactDescription: impact });
        return { error: res.error };
      }}
      onRemove={async (mappingId) => {
        const res = await unlinkIncidentFromAsset(mappingId);
        return { error: res.error };
      }}
      confirmRemoveMessage="¿Desvincular este activo del incidente?"
      columns={[
        {
          key: 'code',
          label: 'Código',
          render: (a) => {
            const item = a as unknown as IncidentAssetItem;
            return (
              <Link
                href={`/assets/${item.asset_id}`}
                className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline"
              >
                {item.code}
              </Link>
            );
          },
        },
        {
          key: 'name',
          label: 'Activo',
          render: (a) => {
            const item = a as unknown as IncidentAssetItem;
            return (
              <div>
                <p className="text-sm text-slate-700">{item.name}</p>
                <p className="text-xs text-slate-400 capitalize">{item.asset_type.replace(/_/g, ' ')}</p>
              </div>
            );
          },
        },
        {
          key: 'criticality',
          label: 'Criticidad',
          render: (a) => <StatusBadge status={(a as unknown as IncidentAssetItem).criticality} />,
        },
        {
          key: 'impact',
          label: 'Impacto',
          render: (a) => {
            const item = a as unknown as IncidentAssetItem;
            return item.impact_description ? (
              <span className="text-xs text-slate-600">{item.impact_description}</span>
            ) : (
              <span className="text-slate-300 text-xs">—</span>
            );
          },
        },
      ]}
      extraModalFields={
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Descripción del impacto (opcional)
          </label>
          <textarea
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            rows={2}
            placeholder="Cómo fue afectado este activo..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>
      }
    />
  );
}
