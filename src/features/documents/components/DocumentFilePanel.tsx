'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, X, Download, Loader2, AlertCircle } from 'lucide-react';
import {
  uploadDocumentFile,
  removeDocumentFile,
} from '@/features/documents/actions/documentFileActions';

interface Props {
  documentId: string;
  filePath: string | null;
  fileSize: number | null;
  mimeType: string | null;
  hashSha256: string | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip';

export function DocumentFilePanel({ documentId, filePath, fileSize, mimeType, hashSha256 }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);

    const fd = new FormData();
    fd.set('file', file);

    startTransition(async () => {
      try {
        const res = await uploadDocumentFile(documentId, fd);
        if (res.error) {
          setError(res.error);
          return;
        }
        // Force a hard refresh so the server component re-fetches the document
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido al subir';
        setError(msg);
        // eslint-disable-next-line no-console
        console.error('[DocumentFilePanel] upload threw:', err);
      }
    });
  };

  const handleRemove = () => {
    if (!confirm('¿Eliminar el archivo adjunto? Esta acción es irreversible.')) return;
    startTransition(async () => {
      try {
        const res = await removeDocumentFile(documentId);
        if (res.error) {
          setError(res.error);
          return;
        }
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido al eliminar';
        setError(msg);
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        <FileText className="w-4 h-4" />
        Archivo
      </h2>

      {filePath ? (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {filePath.split('/').pop()}
              </p>
              <p className="text-xs text-slate-500">
                {mimeType ?? 'Tipo desconocido'} · {formatBytes(fileSize)}
              </p>
              {hashSha256 && (
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  SHA256: {hashSha256.substring(0, 32)}…
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={`/api/documents/${documentId}/download`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar
            </a>
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
              title="Eliminar archivo"
              aria-label="Eliminar archivo"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
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
          className={`flex flex-col items-center justify-center gap-3 py-10 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
          } ${pending ? 'opacity-60 cursor-wait' : ''}`}
        >
          {pending ? (
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-slate-400" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              {pending ? 'Subiendo archivo...' : 'Arrastra un archivo aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, Word, Excel, PowerPoint, imágenes, ZIP · máx 50 MB
            </p>
          </div>
          <input
            ref={inputRef}
            id={`upload-${documentId}`}
            type="file"
            className="sr-only"
            accept={ACCEPTED_TYPES}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={pending}
          />
        </label>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
