'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createAutomationRule, deleteAutomationRule } from '../actions/automationActions';
import type { AutomationRuleRow } from '../services/automationService';
import { Plus, Zap } from 'lucide-react';

const TRIGGER_OPTIONS = [
  { value: 'schedule', label: 'Programado' },
  { value: 'event', label: 'Evento' },
  { value: 'threshold', label: 'Umbral' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'manual', label: 'Manual' },
];

const ACTION_OPTIONS = [
  { value: 'send_notification', label: 'Enviar notificacion' },
  { value: 'create_task', label: 'Crear tarea' },
  { value: 'update_status', label: 'Actualizar estado' },
  { value: 'send_email', label: 'Enviar email' },
  { value: 'create_incident', label: 'Crear incidente' },
  { value: 'run_scan', label: 'Ejecutar escaneo' },
  { value: 'generate_report', label: 'Generar reporte' },
];

const columns = [
  { key: 'code', label: 'Codigo', className: 'w-28 font-mono text-cyan-400' },
  { key: 'name', label: 'Nombre' },
  {
    key: 'trigger_type',
    label: 'Trigger',
    render: (item: AutomationRuleRow) => (
      <span className="text-slate-400 text-sm capitalize">{item.trigger_type?.replace(/_/g, ' ')}</span>
    ),
  },
  {
    key: 'action_type',
    label: 'Accion',
    render: (item: AutomationRuleRow) => (
      <span className="text-slate-400 text-sm capitalize">{item.action_type?.replace(/_/g, ' ')}</span>
    ),
  },
  {
    key: 'is_active',
    label: 'Estado',
    render: (item: AutomationRuleRow) => (
      <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
    ),
  },
  {
    key: 'trigger_count',
    label: 'Ejecuciones',
    render: (item: AutomationRuleRow) => (
      <span className="font-mono text-sm text-slate-300">{item.trigger_count ?? 0}</span>
    ),
  },
];

interface Props {
  data: AutomationRuleRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function RuleList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('is_active', formData.has('is_active') ? 'true' : 'false');
    const result = await createAutomationRule(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta regla de automatizacion?')) return;
    await deleteAutomationRule(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/automation/rules"
        searchPlaceholder="Buscar reglas..."
        onDelete={handleDelete}
        emptyMessage="No hay reglas de automatizacion configuradas"
        emptyIcon={<Zap className="w-8 h-8 text-slate-600" />}
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva Regla de Automatizacion">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="RULE-001" />
            <FormField label="Trigger" name="trigger_type" type="select" required options={TRIGGER_OPTIONS} />
          </div>
          <FormField label="Nombre" name="name" required placeholder="Nombre de la regla" />
          <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion de la regla..." />
          <FormField label="Tipo de accion" name="action_type" type="select" required options={ACTION_OPTIONS} />
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" name="is_active" id="is_active" defaultChecked className="rounded bg-slate-800 border-slate-700 text-cyan-500" />
            <label htmlFor="is_active" className="text-sm text-slate-400">Regla activa</label>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Regla'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
