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
      key: 'name', label: 'Escenario', priority: 1,
      render: (item: RiskRow) => <span className="font-medium text-slate-700">{item.name}</span>,
    },
    {
      key: 'code', label: 'Codigo', priority: 2,
      render: (item: RiskRow) => <span className="font-mono text-sky-600">{item.code}</span>,
    },
    {
      key: 'risk_level_residual', label: 'Riesgo Residual', priority: 3,
      render: (item: RiskRow) => <StatusBadge status={item.risk_level_residual} />,
    },
    {
      key: 'treatment', label: 'Tratamiento', priority: 4,
      render: (item: RiskRow) => <span className="text-xs text-slate-400 capitalize">{item.treatment}</span>,
    },
    {
      key: 'risk_level_inherent', label: 'Riesgo Inherente', hideOnMobile: true,
      render: (item: RiskRow) => <StatusBadge status={item.risk_level_inherent} />,
    },
    {
      key: 'asset', label: 'Activo', hideOnMobile: true,
      render: (item: RiskRow) => (
        <span className="text-xs text-slate-400">{item.assets?.code} - {item.assets?.name}</span>
      ),
    },
    {
      key: 'threat', label: 'Amenaza', hideOnMobile: true,
      render: (item: RiskRow) => (
        <span className="text-xs text-slate-400">{item.threat_catalog?.code} - {item.threat_catalog?.name}</span>
      ),
    },
    {
      key: 'risk_potential', label: 'Valor', hideOnMobile: true,
      render: (item: RiskRow) => (
        <div className="text-right">
          <span className="font-mono text-sm text-slate-600">{Number(item.risk_residual).toFixed(1)}</span>
          <span className="text-xs text-slate-400 ml-1">/ {Number(item.risk_potential).toFixed(1)}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
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
