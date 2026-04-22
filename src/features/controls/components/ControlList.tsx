'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createControl, deleteControl } from '../actions/controlActions';
import type { ControlRow } from '../services/controlService';
import { Plus } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'preventive', label: 'Preventivo' },
  { value: 'detective', label: 'Detectivo' },
  { value: 'corrective', label: 'Correctivo' },
  { value: 'deterrent', label: 'Disuasorio' },
  { value: 'compensating', label: 'Compensatorio' },
  { value: 'recovery', label: 'Recuperacion' },
];

const STATUS_OPTIONS = [
  { value: 'implemented', label: 'Implementado' },
  { value: 'partially_implemented', label: 'Parcialmente implementado' },
  { value: 'planned', label: 'Planificado' },
  { value: 'not_implemented', label: 'No implementado' },
  { value: 'not_applicable', label: 'No aplica' },
];

const FREQUENCY_OPTIONS = [
  { value: 'continuous', label: 'Continuo' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semi_annually', label: 'Semestral' },
  { value: 'annually', label: 'Anual' },
  { value: 'per_access', label: 'Por acceso' },
];

const columns = [
  { key: 'code', label: 'Codigo', className: 'w-28 font-mono text-sky-600' },
  { key: 'name', label: 'Nombre' },
  {
    key: 'control_type',
    label: 'Tipo',
    render: (item: ControlRow) => (
      <span className="text-slate-400 text-sm capitalize">{item.control_type?.replace(/_/g, ' ')}</span>
    ),
  },
  {
    key: 'status',
    label: 'Estado',
    render: (item: ControlRow) => <StatusBadge status={item.status} />,
  },
  {
    key: 'overall_effectiveness',
    label: 'Efectividad',
    render: (item: ControlRow) => item.overall_effectiveness !== null ? (
      <span className="font-mono text-xs text-slate-600">{item.overall_effectiveness}%</span>
    ) : <span className="text-slate-400">—</span>,
  },
  { key: 'department', label: 'Departamento', className: 'text-slate-400' },
];

interface Props {
  data: ControlRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function ControlList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createControl(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este control?')) return;
    await deleteControl(id);
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
          Nuevo Control
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/controls"
        searchPlaceholder="Buscar controles..."
        onDelete={handleDelete}
        emptyMessage="No hay controles registrados"
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nuevo Control">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="CTL-001" />
            <FormField label="Tipo" name="control_type" type="select" required options={TYPE_OPTIONS} />
          </div>
          <FormField label="Nombre" name="name" required placeholder="Nombre del control" />
          <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion del control..." />
          <FormField label="Objetivo" name="objective" type="textarea" placeholder="Que busca lograr el control..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estado" name="status" type="select" options={STATUS_OPTIONS} defaultValue="planned" />
            <FormField label="Frecuencia de ejecucion" name="execution_frequency" type="select" options={FREQUENCY_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Departamento" name="department" placeholder="TI, Ciberseguridad, RRHH..." />
            <FormField label="Efectividad general (%)" name="overall_effectiveness" type="number" placeholder="0-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Implementacion" name="implementation_date" type="date" />
            <FormField label="Proxima revision" name="next_review_date" type="date" />
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
              {loading ? 'Guardando...' : 'Crear Control'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
