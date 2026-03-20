'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createDocument, deleteDocument } from '../actions/documentActions';
import type { DocumentRow } from '../services/documentService';
import { Plus, FileText } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'policy', label: 'Politica' },
  { value: 'procedure', label: 'Procedimiento' },
  { value: 'standard', label: 'Estandar' },
  { value: 'guideline', label: 'Guia' },
  { value: 'plan', label: 'Plan' },
  { value: 'record', label: 'Registro' },
  { value: 'report', label: 'Informe' },
  { value: 'contract', label: 'Contrato' },
  { value: 'other', label: 'Otro' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'under_review', label: 'En revision' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Archivado' },
  { value: 'obsolete', label: 'Obsoleto' },
];

const columns = [
  { key: 'code', label: 'Codigo', className: 'w-28 font-mono text-sky-600' },
  { key: 'name', label: 'Nombre' },
  {
    key: 'document_type',
    label: 'Tipo',
    render: (item: DocumentRow) => (
      <span className="text-slate-400 text-sm capitalize">{item.document_type?.replace(/_/g, ' ')}</span>
    ),
  },
  { key: 'version', label: 'Version', className: 'text-slate-400 font-mono text-sm' },
  {
    key: 'status',
    label: 'Estado',
    render: (item: DocumentRow) => <StatusBadge status={item.status} />,
  },
  {
    key: 'review_date',
    label: 'Revision',
    render: (item: DocumentRow) => (
      <span className="text-slate-400 text-sm">
        {item.review_date ? new Date(item.review_date).toLocaleDateString('es-CO') : '-'}
      </span>
    ),
  },
];

interface Props {
  data: DocumentRow[];
  count: number;
  page: number;
  pageSize: number;
}

export function DocumentList({ data, count, page, pageSize }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createDocument(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este documento?')) return;
    await deleteDocument(id);
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
          Nuevo Documento
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        count={count}
        page={page}
        pageSize={pageSize}
        basePath="/documents"
        searchPlaceholder="Buscar documentos..."
        onDelete={handleDelete}
        emptyMessage="No hay documentos registrados"
        emptyIcon={<FileText className="w-8 h-8 text-slate-600" />}
      />

      <FormModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nuevo Documento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Codigo" name="code" required placeholder="DOC-001" />
            <FormField label="Tipo" name="document_type" type="select" required options={TYPE_OPTIONS} />
          </div>
          <FormField label="Nombre" name="name" required placeholder="Nombre del documento" />
          <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion del documento..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estado" name="status" type="select" options={STATUS_OPTIONS} defaultValue="draft" />
            <FormField label="Version" name="version" placeholder="1.0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Autor" name="author" placeholder="Nombre del autor" />
            <FormField label="Responsable" name="owner" placeholder="Nombre del responsable" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha de revision" name="review_date" type="date" />
            <FormField label="Fecha de vencimiento" name="expiry_date" type="date" />
          </div>
          <FormField label="URL del archivo" name="file_url" placeholder="https://..." />

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
              {loading ? 'Guardando...' : 'Crear Documento'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
