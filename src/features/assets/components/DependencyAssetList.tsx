'use client';

import { useState } from 'react';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AssetForm } from './AssetForm';
import { deleteAsset } from '../actions/assetActions';
import { Plus } from 'lucide-react';
import type { AssetRow } from '../services/assetService';

interface Props {
  data: AssetRow[];
  count: number;
  page: number;
  pageSize: number;
  dependencyId: string;
  dependencyName: string;
  dependencyKind: string;
  processName: string;
  /** Process category id. Used as the asset's category_id so the tree remains consistent. */
  categoryId: string;
  autoOpenForm?: boolean;
}

export function DependencyAssetList({
  data,
  count,
  page,
  pageSize,
  dependencyId,
  dependencyName,
  dependencyKind,
  processName,
  categoryId,
  autoOpenForm,
}: Props) {
  const [showForm, setShowForm] = useState(Boolean(autoOpenForm));

  const columns = [
    {
      key: 'code',
      label: 'Código',
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
      key: 'asset_type',
      label: 'Tipo Activo',
      render: (item: AssetRow) => (
        <span className="text-xs text-slate-500 capitalize">
          {item.asset_type.replace(/_/g, ' ')}
        </span>
      ),
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

  const contextLabel = `${processName} · ${dependencyKind}: ${dependencyName}`;

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? (
            'Cancelar'
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Nuevo Activo en esta dependencia
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AssetForm
            onClose={() => setShowForm(false)}
            defaultCategoryId={categoryId}
            defaultDependencyIds={[dependencyId]}
            contextLabel={contextLabel}
          />
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath={`/assets/dependency/${dependencyId}`}
        searchPlaceholder="Buscar activos en esta dependencia..."
        onDelete={async (id) => {
          if (confirm('Eliminar este activo?')) {
            await deleteAsset(id);
            window.location.reload();
          }
        }}
        emptyMessage="No hay activos en esta dependencia. Crea el primero."
      />
    </>
  );
}
