'use client';

import { useState } from 'react';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AssetForm } from './AssetForm';
import { deleteAsset } from '../actions/assetActions';
import { Server, Monitor, Wifi, Database, Users, Building, Cloud, Shield } from 'lucide-react';
import type { AssetRow } from '../services/assetService';

const typeIcons: Record<string, React.ReactNode> = {
  hardware: <Monitor className="w-4 h-4 text-blue-400" />,
  software: <Server className="w-4 h-4 text-purple-400" />,
  network: <Wifi className="w-4 h-4 text-sky-500" />,
  data: <Database className="w-4 h-4 text-emerald-400" />,
  personnel: <Users className="w-4 h-4 text-amber-400" />,
  facility: <Building className="w-4 h-4 text-orange-400" />,
  service: <Shield className="w-4 h-4 text-blue-400" />,
  cloud_resource: <Cloud className="w-4 h-4 text-sky-400" />,
};

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
        <span className="font-mono text-sky-600">{item.code}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (item: AssetRow) => (
        <div className="flex items-center gap-2">
          {typeIcons[item.asset_type] || <Server className="w-4 h-4 text-slate-500" />}
          <span className="font-medium text-slate-700">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'asset_type',
      label: 'Tipo',
      render: (item: AssetRow) => (
        <span className="text-xs text-slate-400 capitalize">{item.asset_type.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'criticality',
      label: 'Criticidad',
      render: (item: AssetRow) => <StatusBadge status={item.criticality} />,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (item: AssetRow) => <StatusBadge status={item.status} />,
    },
    {
      key: 'magerit',
      label: 'MAGERIT (C/I/D/A/T)',
      render: (item: AssetRow) => (
        <div className="flex gap-1 font-mono text-xs">
          <span className="text-sky-600">{item.val_confidentiality}</span>/
          <span className="text-blue-400">{item.val_integrity}</span>/
          <span className="text-emerald-400">{item.val_availability}</span>/
          <span className="text-amber-400">{item.val_authenticity}</span>/
          <span className="text-purple-400">{item.val_traceability}</span>
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
          + Nuevo Activo
        </button>
      </div>

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

      <AssetForm isOpen={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}
