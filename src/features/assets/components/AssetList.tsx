'use client';

import { useState } from 'react';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AssetForm } from './AssetForm';
import { deleteAsset } from '../actions/assetActions';
import { FileSpreadsheet } from 'lucide-react';
import type { AssetRow } from '../services/assetService';

interface AssetListProps {
  data: AssetRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function AssetList({ data, count, page, pageSize }: AssetListProps) {
  const [showForm, setShowForm] = useState(false);

  const columns = [
    {
      key: 'code',
      label: 'Codigo',
      render: (item: AssetRow) => (
        <span className="font-mono text-sky-600 text-xs">{item.code}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (item: AssetRow) => (
        <span className="font-medium text-slate-700">{item.name}</span>
      ),
    },
    {
      key: 'process_type',
      label: 'Tipo Proceso',
      render: (item: AssetRow) => (
        <span className="text-xs text-slate-500 capitalize">
          {item.process_type ? item.process_type.replace(/_/g, ' ') : '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'sede',
      label: 'Sede',
      render: (item: AssetRow) => (
        <span className="text-xs text-slate-500">{item.sede || '-'}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'asset_type',
      label: 'Tipo Activo',
      render: (item: AssetRow) => (
        <span className="text-xs text-slate-500 capitalize">
          {item.asset_type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'criticality_cid',
      label: 'Criticidad CID',
      render: (item: AssetRow) => (
        <StatusBadge status={item.criticality_cid ?? item.criticality} />
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (item: AssetRow) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-2">
        <a
          href="/api/assets/export"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar Excel
        </a>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Activo'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AssetForm onClose={() => setShowForm(false)} />
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/assets"
        searchPlaceholder="Buscar activos..."
        onDelete={async (id) => {
          if (confirm('Eliminar este activo?')) {
            await deleteAsset(id);
            window.location.reload();
          }
        }}
        emptyMessage="No hay activos registrados. Crea el primero."
      />
    </>
  );
}
