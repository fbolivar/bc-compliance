'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, X, Download, Loader2, AlertCircle } from 'lucide-react';
import {
  uploadDocumentAttachment,
  removeDocumentAttachment,
} from '@/features/documents/actions/documentFileActions';
import type { DocumentAttachment } from '@/features/documents/services/documentService';

interface Props {
  documentId: string;
  attachments: DocumentAttachment[];
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

function iconFor(mime: string | null): string {
  if (!mime) return '📄';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('word')) return '📘';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return '📗';
  if (mime.includes('powerpoint') || mime.includes('presentation')) return '📙';
  if (mime.includes('zip')) return '🗜️';
  return '📄';
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip';

export function DocumentFilePanel({ documentId, attachments }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const uploadOne = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadDocumentAttachment(documentId, fd);
    return res.error ?? null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const list = Array.from(files);
    setUploadingCount(list.length);

    startTransition(async () => {
      const errors: string[] = [];
      for (const f of list) {
        try {
          const err = await uploadOne(f);
          if (err) errors.push(`${f.name}: ${err}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error desconocido';
          errors.push(`${f.name}: ${msg}`);
        }
      }
      setUploadingCount(0);
      if (errors.length > 0) setError(errors.join(' | '));
      router.refresh();
    });
  };

  const handleRemove = (attachmentId: string, filename: string) => {
    if (!confirm(`¿Eliminar el archivo "${filename}"?`)) return;
    startTransition(async () => {
      try {
        const res = await removeDocumentAttachment(attachmentId);
        if (res.error) {
          setError(res.error);
          return;
        }
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(msg);
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          Archivos
          <span className="text-xs text-slate-400 ml-1">({attachments.length})</span>
        </h2>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2 mb-4">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">
                  {iconFor(att.mime_type)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{att.file_name}</p>
                  <p className="text-xs text-slate-500">
                    {att.mime_type ?? 'Tipo desconocido'} · {formatBytes(att.file_size)}
                    {att.created_at && (
                      <span className="ml-2">
                        · {new Date(att.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                      </span>
                    )}
                  </p>
                  {att.description && (
                    <p className="text-xs text-slate-500 italic mt-0.5 truncate">{att.description}</p>
                  )}
                  {att.hash_sha256 && (
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      SHA256: {att.hash_sha256.substring(0, 24)}…
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={`/api/documents/${documentId}/attachments/${att.id}/download`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                  title={`Descargar ${att.file_name}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(att.id, att.file_name)}
                  disabled={pending}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                  title="Eliminar archivo"
                  aria-label="Eliminar archivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone siempre visible — permite múltiples archivos */}
      <label
        htmlFor={`upload-${documentId}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 py-8 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
        } ${pending ? 'opacity-60 cursor-wait' : ''}`}
      >
        {pending ? (
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-slate-400" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            {pending
              ? uploadingCount > 1
                ? `Subiendo ${uploadingCount} archivos...`
                : 'Subiendo archivo...'
              : attachments.length > 0
                ? 'Añadir más archivos'
                : 'Arrastra archivos aquí o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Puedes seleccionar varios · PDF, Word, Excel, imágenes, ZIP · máx 50 MB c/u
          </p>
        </div>
        <input
          id={`upload-${documentId}`}
          type="file"
          multiple
          className="sr-only"
          accept={ACCEPTED_TYPES}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ''; // permitir re-subir el mismo archivo después
          }}
          disabled={pending}
        />
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
