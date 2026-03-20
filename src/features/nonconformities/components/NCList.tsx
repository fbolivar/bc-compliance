'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createNC, deleteNC } from '../actions/ncActions';
import type { NCRow } from '../services/ncService';
import { Plus } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'nonconformity', label: 'No Conformidad' },
  { value: 'observation', label: 'Observacion' },
  { value: 'opportunity_for_improvement', label: 'Oportunidad de mejora' },
  { value: 'major', label: 'No Conformidad Mayor' },
  { value: 'minor', label: 'No Conformidad Menor' },
];

const SEVERITY_OPTIONS = [
  { value: 'major', label: 'Mayor' },
  { value: 'minor', label: 'Menor' },
  { value: 'observation', label: 'Observacion' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Abierta' },
  { value: 'root_cause_analysis', label: 'Analisis causa raiz' },
  { value: 'action_planned', label: 'Accion planificada' },
  { value: 'action_in_progress', label: 'Accion en progreso' },
  { value: 'verification', label: 'En verificacion' },
  { value: 'closed', label: 'Cerrada' },
  { value: 'reopened', label: 'Reabierta' },
];

const SOURCE_OPTIONS = [
  { value: 'internal_audit', label: 'Auditoria interna' },
  { value: 'external_audit', label: 'Auditoria externa' },
  { value: 'self_assessment', label: 'Autoevaluacion' },
  { value: 'incident', label: 'Incidente' },
  { value: 'customer_complaint', label: 'Queja de cliente' },
  { value: 'management_review', label: 'Revision gerencial' },
];

const columns = [
  { key: 'code', label: 'Codigo', className: 'w-28 font-mono text-sky-600' },
  { key: 'title', label: 'Titulo' },
  {
    key: 'type',
    label: 'Tipo',
    render: (item: NCRow) => <StatusBadge status={item.type} />,
  },
  {
    key: 'severity',
    label: 'Severidad',
    render: (item: NCRow) => <StatusBadge status={item.severity} />,
  },
  {
    key: 'status',
    label: 'Estado',
    render: (item: NCRow) => <StatusBadge status={item.status} />,
  },
  {
    key: 'due_date',
    label: 'Vencimiento',
    render: (item: NCRow) => (
      <span className="text-slate-400 text-sm">
        {item.due_date ? new Date(item.due_date).toLocaleDateString('es-CO') : '-'}
      </span>
    ),
  },
];

interface Props {
  data: NCRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function NCList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createNC(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta no conformidad?')) return;
    await deleteNC(id);
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
          Nueva No Conformidad
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/nonconformities"
        searchPlaceholder="Buscar no conformidades..."
        onDelete={handleDelete}
        emptyMessage="No hay no conformidades registradas"
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva No Conformidad">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="NC-001" />
            <FormField label="Tipo" name="type" type="select" required options={TYPE_OPTIONS} />
          </div>
          <FormField label="Titulo" name="title" required placeholder="Descripcion breve" />
          <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion detallada..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Severidad" name="severity" type="select" required options={SEVERITY_OPTIONS} />
            <FormField label="Estado" name="status" type="select" options={STATUS_OPTIONS} defaultValue="open" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fuente" name="source" type="select" options={SOURCE_OPTIONS} />
            <FormField label="Fecha deteccion" name="detected_date" type="date" />
          </div>
          <FormField label="Fecha limite" name="due_date" type="date" />
          <FormField label="Causa raiz" name="root_cause" type="textarea" placeholder="Causa raiz identificada..." />
          <FormField label="Accion correctiva" name="corrective_action" type="textarea" placeholder="Acciones correctivas planificadas..." />

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
              {loading ? 'Guardando...' : 'Crear No Conformidad'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
