'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createAsset, updateAsset } from '../actions/assetActions';

const ASSET_TYPES = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'network', label: 'Red' },
  { value: 'data', label: 'Datos' },
  { value: 'personnel', label: 'Personal' },
  { value: 'facility', label: 'Instalacion' },
  { value: 'service', label: 'Servicio' },
  { value: 'intangible', label: 'Intangible' },
  { value: 'cloud_resource', label: 'Recurso Cloud' },
  { value: 'iot_device', label: 'Dispositivo IoT' },
];

const STATUSES = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'decommissioned', label: 'Descomisionado' },
  { value: 'under_maintenance', label: 'En mantenimiento' },
  { value: 'planned', label: 'Planificado' },
];

const CRITICALITIES = [
  { value: 'very_high', label: 'Muy Alta' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
  { value: 'very_low', label: 'Muy Baja' },
];

interface AssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Record<string, unknown>;
}

export function AssetForm({ isOpen, onClose, editData }: AssetFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!editData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Handle checkbox values
    formData.set('is_critical', formData.has('is_critical') ? 'true' : 'false');
    formData.set('pii_data', formData.has('pii_data') ? 'true' : 'false');
    formData.set('financial_data', formData.has('financial_data') ? 'true' : 'false');

    const result = isEdit
      ? await updateAsset(editData!.id as string, formData)
      : await createAsset(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      router.refresh();
    }
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Activo' : 'Nuevo Activo'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Codigo" name="code" required placeholder="AST-001" defaultValue={editData?.code as string} />
          <FormField label="Nombre" name="name" required placeholder="Servidor Web Principal" defaultValue={editData?.name as string} />
        </div>

        <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion del activo..." defaultValue={editData?.description as string} />

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Tipo" name="asset_type" type="select" required options={ASSET_TYPES} defaultValue={editData?.asset_type as string} />
          <FormField label="Estado" name="status" type="select" options={STATUSES} defaultValue={(editData?.status as string) || 'active'} />
          <FormField label="Criticidad" name="criticality" type="select" options={CRITICALITIES} defaultValue={(editData?.criticality as string) || 'medium'} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Departamento" name="department" placeholder="TI" defaultValue={editData?.department as string} />
          <FormField label="Ubicacion" name="location" placeholder="Data Center 1" defaultValue={editData?.location as string} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="IP" name="ip_address" placeholder="192.168.1.100" defaultValue={editData?.ip_address as string} />
          <FormField label="Hostname" name="hostname" placeholder="srv-web-01" defaultValue={editData?.hostname as string} />
        </div>

        {/* MAGERIT Valuation */}
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs font-medium text-sky-600 uppercase tracking-wider mb-3">Valoracion MAGERIT (0-10)</p>
          <div className="grid grid-cols-5 gap-3">
            <FormField label="[C]" name="val_confidentiality" type="number" min={0} max={10} defaultValue={editData?.val_confidentiality as number || 0} />
            <FormField label="[I]" name="val_integrity" type="number" min={0} max={10} defaultValue={editData?.val_integrity as number || 0} />
            <FormField label="[D]" name="val_availability" type="number" min={0} max={10} defaultValue={editData?.val_availability as number || 0} />
            <FormField label="[A]" name="val_authenticity" type="number" min={0} max={10} defaultValue={editData?.val_authenticity as number || 0} />
            <FormField label="[T]" name="val_traceability" type="number" min={0} max={10} defaultValue={editData?.val_traceability as number || 0} />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="is_critical" defaultChecked={editData?.is_critical as boolean} className="rounded bg-white border-slate-300 text-sky-500" />
            Activo critico
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="pii_data" defaultChecked={editData?.pii_data as boolean} className="rounded bg-white border-slate-300 text-sky-500" />
            Datos PII
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="financial_data" defaultChecked={editData?.financial_data as boolean} className="rounded bg-white border-slate-300 text-sky-500" />
            Datos financieros
          </label>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Activo'}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
