'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createIncident, deleteIncident } from '../actions/incidentActions';
import type { IncidentRow } from '../services/incidentService';
import { Plus } from 'lucide-react';

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critico' },
  { value: 'high', label: 'Alto' },
  { value: 'medium', label: 'Medio' },
  { value: 'low', label: 'Bajo' },
];

const STATUS_OPTIONS = [
  { value: 'detected', label: 'Detectado' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'investigating', label: 'En investigacion' },
  { value: 'containing', label: 'Conteniendo' },
  { value: 'eradicating', label: 'Erradicando' },
  { value: 'recovering', label: 'Recuperando' },
  { value: 'post_incident', label: 'Post-incidente' },
  { value: 'closed', label: 'Cerrado' },
];

const CATEGORY_OPTIONS = [
  { value: 'malware', label: 'Malware' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'data_breach', label: 'Brecha de datos' },
  { value: 'ransomware', label: 'Ransomware' },
  { value: 'ddos', label: 'DDoS' },
  { value: 'insider_threat', label: 'Amenaza interna' },
  { value: 'unauthorized_access', label: 'Acceso no autorizado' },
  { value: 'system_failure', label: 'Fallo de sistema' },
  { value: 'other', label: 'Otro' },
];

const columns = [
  { key: 'title', label: 'Titulo', priority: 1 },
  { key: 'code', label: 'Codigo', priority: 2, className: 'w-28 font-mono text-sky-600' },
  {
    key: 'severity', label: 'Severidad', priority: 3,
    render: (item: IncidentRow) => <StatusBadge status={item.severity} />,
  },
  {
    key: 'status', label: 'Estado', priority: 4,
    render: (item: IncidentRow) => <StatusBadge status={item.status} />,
  },
  {
    key: 'category', label: 'Categoria', hideOnMobile: true,
    render: (item: IncidentRow) => (
      <span className="text-slate-400 text-sm">{item.category?.replace(/_/g, ' ') || '-'}</span>
    ),
  },
  {
    key: 'detected_at', label: 'Detectado', hideOnMobile: true,
    render: (item: IncidentRow) => (
      <span className="text-slate-400 text-sm">
        {item.detected_at ? new Date(item.detected_at).toLocaleDateString('es-CO') : '-'}
      </span>
    ),
  },
];

interface Props {
  data: IncidentRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function IncidentList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createIncident(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este incidente?')) return;
    await deleteIncident(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Reportar Incidente
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/incidents"
        searchPlaceholder="Buscar incidentes..."
        onDelete={handleDelete}
        emptyMessage="No hay incidentes registrados"
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Reportar Incidente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="INC-001" />
            <FormField label="Severidad" name="severity" type="select" required options={SEVERITY_OPTIONS} />
          </div>
          <FormField label="Titulo" name="title" required placeholder="Descripcion breve del incidente" />
          <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion detallada del incidente..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estado" name="status" type="select" options={STATUS_OPTIONS} defaultValue="detected" />
            <FormField label="Categoria" name="category" type="select" options={CATEGORY_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Detectado" name="detected_at" type="datetime-local" />
            <FormField label="Fuente" name="source" placeholder="Usuario, SIEM, IDS, escaneo..." />
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Reportar Incidente'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
