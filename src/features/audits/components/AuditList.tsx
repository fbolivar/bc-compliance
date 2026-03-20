'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createAudit, deleteAudit } from '../actions/auditActions';
import type { AuditRow } from '../services/auditService';
import { Plus } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'internal', label: 'Interna' },
  { value: 'external', label: 'Externa' },
  { value: 'certification', label: 'Certificacion' },
  { value: 'regulatory', label: 'Regulatoria' },
  { value: 'supplier', label: 'Proveedor' },
  { value: 'follow_up', label: 'Seguimiento' },
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planificada' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'draft', label: 'Borrador' },
];

const columns = [
  { key: 'code', label: 'Codigo', className: 'w-28 font-mono text-sky-600' },
  { key: 'name', label: 'Nombre' },
  {
    key: 'audit_type',
    label: 'Tipo',
    render: (item: AuditRow) => (
      <span className="text-slate-400 text-sm capitalize">{item.audit_type?.replace(/_/g, ' ')}</span>
    ),
  },
  {
    key: 'status',
    label: 'Estado',
    render: (item: AuditRow) => <StatusBadge status={item.status} />,
  },
  { key: 'lead_auditor', label: 'Auditor Lider', className: 'text-slate-400' },
  {
    key: 'planned_start',
    label: 'Inicio',
    render: (item: AuditRow) => (
      <span className="text-slate-400 text-sm">
        {item.planned_start ? new Date(item.planned_start).toLocaleDateString('es-CO') : '-'}
      </span>
    ),
  },
  {
    key: 'planned_end',
    label: 'Fin',
    render: (item: AuditRow) => (
      <span className="text-slate-400 text-sm">
        {item.planned_end ? new Date(item.planned_end).toLocaleDateString('es-CO') : '-'}
      </span>
    ),
  },
];

interface Props {
  data: AuditRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function AuditList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createAudit(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta auditoria?')) return;
    await deleteAudit(id);
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
          Nueva Auditoria
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/audits"
        searchPlaceholder="Buscar auditorias..."
        onDelete={handleDelete}
        emptyMessage="No hay auditorias registradas"
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva Auditoria">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="AUD-001" />
            <FormField label="Tipo" name="audit_type" type="select" required options={TYPE_OPTIONS} />
          </div>
          <FormField label="Nombre" name="name" required placeholder="Nombre de la auditoria" />
          <FormField label="Alcance" name="scope" type="textarea" placeholder="Alcance y objetivos de la auditoria..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estado" name="status" type="select" options={STATUS_OPTIONS} defaultValue="planned" />
            <FormField label="Auditor Lider" name="lead_auditor" placeholder="Nombre del auditor" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Inicio planificado" name="planned_start" type="date" />
            <FormField label="Fin planificado" name="planned_end" type="date" />
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
              {loading ? 'Guardando...' : 'Crear Auditoria'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
