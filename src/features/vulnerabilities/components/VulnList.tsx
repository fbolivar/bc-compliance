'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createVulnerability, deleteVulnerability } from '../actions/vulnActions';
import type { VulnRow } from '../services/vulnService';
import { Plus } from 'lucide-react';
import { VulnImport } from './VulnImport';

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critica' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
  { value: 'informational', label: 'Informacional' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Abierta' },
  { value: 'in_remediation', label: 'En remediacion' },
  { value: 'mitigated', label: 'Mitigada' },
  { value: 'accepted', label: 'Aceptada' },
  { value: 'false_positive', label: 'Falso positivo' },
  { value: 'closed', label: 'Cerrada' },
];

const columns = [
  { key: 'title', label: 'Nombre', priority: 1, render: (item: VulnRow) => <span className="font-medium text-slate-700">{item.title}</span> },
  { key: 'code', label: 'Codigo', priority: 2, render: (item: VulnRow) => <span className="font-mono text-sky-600 text-xs">{item.code}</span> },
  { key: 'severity', label: 'Severidad', priority: 3, render: (item: VulnRow) => <StatusBadge status={item.severity} /> },
  { key: 'status', label: 'Estado', priority: 4, render: (item: VulnRow) => <StatusBadge status={item.status} /> },
  { key: 'cvss_base_score', label: 'CVSS', render: (item: VulnRow) => <span className="font-mono text-sm">{item.cvss_base_score ?? '-'}</span> },
  { key: 'affected_host', label: 'Host', render: (item: VulnRow) => <span className="font-mono text-xs text-slate-600">{item.affected_host || '-'}{item.affected_port ? `:${item.affected_port}` : ''}</span>, hideOnMobile: true },
  { key: 'cve_id', label: 'CVE', render: (item: VulnRow) => <span className="font-mono text-xs text-slate-500">{item.cve_id || '-'}</span>, hideOnMobile: true },
];

interface Props {
  data: VulnRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function VulnList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createVulnerability(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta vulnerabilidad?')) return;
    await deleteVulnerability(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <VulnImport />
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Vulnerabilidad
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/vulnerabilities"
        searchPlaceholder="Buscar vulnerabilidades..."
        onDelete={handleDelete}
        emptyMessage="No hay vulnerabilidades registradas"
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva Vulnerabilidad">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="VUL-001" />
            <FormField label="ID CVE" name="cve_id" placeholder="CVE-2024-XXXX" />
          </div>
          <FormField label="Nombre" name="title" required placeholder="Nombre de la vulnerabilidad" />
          <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion detallada..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Severidad" name="severity" type="select" required options={SEVERITY_OPTIONS} />
            <FormField label="Estado" name="status" type="select" options={STATUS_OPTIONS} defaultValue="open" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Score CVSS" name="cvss_base_score" type="number" min={0} max={10} step={0.1} placeholder="0.0" />
            <FormField label="Fecha limite" name="due_date" type="date" />
          </div>
          <FormField label="Remediacion" name="remediation" type="textarea" placeholder="Plan de remediacion..." />

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
              {loading ? 'Guardando...' : 'Crear Vulnerabilidad'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
