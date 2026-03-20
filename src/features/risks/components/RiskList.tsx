'use client';

import { useState } from 'react';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { RiskForm } from './RiskForm';
import { deleteRisk } from '../actions/riskActions';
import type { RiskRow } from '../services/riskService';

interface RiskListProps {
  data: RiskRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function RiskList({ data, count, page, pageSize }: RiskListProps) {
  const [showForm, setShowForm] = useState(false);

  const columns = [
    {
      key: 'code',
      label: 'Codigo',
      render: (item: RiskRow) => <span className="font-mono text-cyan-400">{item.code}</span>,
    },
    {
      key: 'name',
      label: 'Escenario',
      render: (item: RiskRow) => <span className="font-medium text-slate-200">{item.name}</span>,
    },
    {
      key: 'asset',
      label: 'Activo',
      render: (item: RiskRow) => (
        <span className="text-xs text-slate-400">{item.assets?.code} - {item.assets?.name}</span>
      ),
    },
    {
      key: 'threat',
      label: 'Amenaza',
      render: (item: RiskRow) => (
        <span className="text-xs text-slate-400">{item.threat_catalog?.code} - {item.threat_catalog?.name}</span>
      ),
    },
    {
      key: 'risk_level_inherent',
      label: 'Riesgo Inherente',
      render: (item: RiskRow) => <StatusBadge status={item.risk_level_inherent} />,
    },
    {
      key: 'risk_level_residual',
      label: 'Riesgo Residual',
      render: (item: RiskRow) => <StatusBadge status={item.risk_level_residual} />,
    },
    {
      key: 'risk_potential',
      label: 'Valor',
      render: (item: RiskRow) => (
        <div className="text-right">
          <span className="font-mono text-sm text-slate-300">{Number(item.risk_residual).toFixed(1)}</span>
          <span className="text-xs text-slate-600 ml-1">/ {Number(item.risk_potential).toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'treatment',
      label: 'Tratamiento',
      render: (item: RiskRow) => (
        <span className="text-xs text-slate-400 capitalize">{item.treatment}</span>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Nuevo Riesgo
        </button>
      </div>

      <DataTable
        data={data as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Array<{ key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }>}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/risks"
        searchPlaceholder="Buscar riesgos..."
        onDelete={async (id) => {
          if (confirm('Eliminar este riesgo?')) {
            await deleteRisk(id);
            window.location.reload();
          }
        }}
        emptyMessage="No hay escenarios de riesgo. Crea el primero."
      />

      <RiskForm isOpen={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}
