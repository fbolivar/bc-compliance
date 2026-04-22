'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createVendor, deleteVendor } from '../actions/vendorActions';
import type { VendorRow } from '../services/vendorService';
import { Plus } from 'lucide-react';

const VENDOR_TYPE_OPTIONS = [
  { value: 'cloud_provider', label: 'Proveedor Cloud' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'services', label: 'Servicios' },
  { value: 'consulting', label: 'Consultoria' },
  { value: 'security', label: 'Seguridad' },
  { value: 'telecommunications', label: 'Telecomunicaciones' },
  { value: 'other', label: 'Otro' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'under_evaluation', label: 'En evaluacion' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'terminated', label: 'Terminado' },
  { value: 'inactive', label: 'Inactivo' },
];

const RISK_OPTIONS = [
  { value: 'critical', label: 'Critico' },
  { value: 'high', label: 'Alto' },
  { value: 'medium', label: 'Medio' },
  { value: 'low', label: 'Bajo' },
];

const columns = [
  { key: 'code', label: 'Codigo', className: 'w-28 font-mono text-sky-600' },
  { key: 'name', label: 'Proveedor' },
  {
    key: 'vendor_type',
    label: 'Tipo',
    render: (item: VendorRow) => (
      <span className="text-slate-400 text-sm">{item.vendor_type?.replace(/_/g, ' ') || '-'}</span>
    ),
  },
  {
    key: 'risk_level',
    label: 'Riesgo',
    render: (item: VendorRow) => item.risk_level ? <StatusBadge status={item.risk_level} /> : <span className="text-slate-600">-</span>,
  },
  {
    key: 'status',
    label: 'Estado',
    render: (item: VendorRow) => <StatusBadge status={item.status} />,
  },
  { key: 'contact_email', label: 'Contacto', className: 'text-slate-400 text-sm' },
];

interface Props {
  data: VendorRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function VendorList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createVendor(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este proveedor?')) return;
    await deleteVendor(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proveedor
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/vendors"
        searchPlaceholder="Buscar proveedores..."
        onDelete={handleDelete}
        emptyMessage="No hay proveedores registrados"
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nuevo Proveedor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="VEN-001" />
            <FormField label="Tipo" name="vendor_type" type="select" options={VENDOR_TYPE_OPTIONS} />
          </div>
          <FormField label="Nombre" name="name" required placeholder="Nombre del proveedor" />
          <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion del servicio..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estado" name="status" type="select" options={STATUS_OPTIONS} defaultValue="active" />
            <FormField label="Nivel de riesgo" name="risk_level" type="select" options={RISK_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contacto" name="contact_name" placeholder="Nombre del contacto" />
            <FormField label="Email" name="contact_email" type="email" placeholder="email@proveedor.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Telefono" name="contact_phone" placeholder="+57 300 000 0000" />
            <FormField label="Pais" name="country" placeholder="Colombia" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Inicio contrato" name="contract_start" type="date" />
            <FormField label="Fin contrato" name="contract_end" type="date" />
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="handles_pii" className="rounded bg-white border-slate-300 text-sky-500" />
              Procesa PII
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="handles_financial_data" className="rounded bg-white border-slate-300 text-sky-500" />
              Procesa datos financieros
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="has_dpa" className="rounded bg-white border-slate-300 text-sky-500" />
              Contrato DPA firmado
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="has_iso27001" className="rounded bg-white border-slate-300 text-sky-500" />
              ISO 27001
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="has_soc2" className="rounded bg-white border-slate-300 text-sky-500" />
              SOC 2
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="has_pentest" className="rounded bg-white border-slate-300 text-sky-500" />
              Pentest reciente
            </label>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
