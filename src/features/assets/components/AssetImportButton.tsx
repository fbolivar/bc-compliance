'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { importAssets, type ImportResult } from '../actions/importActions';

export function AssetImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function close() {
    setIsOpen(false);
    reset();
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
  }

  function onSubmit() {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    startTransition(async () => {
      const res = await importAssets(fd);
      setResult(res);
      if (res.ok) {
        // Refresh server data after success
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Upload className="w-4 h-4 text-sky-600" />
        Importar Excel
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Importar inventario de activos</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Carga un Excel con el formato BC Trust (43 columnas)
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template hint */}
            <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-4">
              <p className="text-xs text-slate-600 mb-2">
                Si no tienes el formato, descarga la plantilla con encabezados y un ejemplo:
              </p>
              <a
                href="/api/assets/import-template"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-800"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar plantilla Excel
              </a>
            </div>

            {/* File picker */}
            {!file && !result && (
              <label
                htmlFor="asset-import-file"
                className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-sky-400 hover:bg-sky-50/50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Selecciona un archivo .xlsx</p>
                <p className="text-xs text-slate-500 mt-1">Máximo 10 MB</p>
                <input
                  ref={inputRef}
                  id="asset-import-file"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={onSelect}
                />
              </label>
            )}

            {/* Selected file */}
            {file && !result && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={isPending}
                  className="text-slate-400 hover:text-rose-500 p-1 disabled:opacity-50"
                  aria-label="Quitar archivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`rounded-xl p-4 mb-4 border ${
                result.ok
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    {result.ok ? (
                      <>
                        <p className="text-sm font-semibold text-emerald-800">
                          Importación completada
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          <strong>{result.inserted ?? 0}</strong> nuevos ·{' '}
                          <strong>{result.updated ?? 0}</strong> actualizados
                          {result.skipped ? <> · <strong>{result.skipped}</strong> con error</> : null}
                        </p>
                        <p className="text-xs text-emerald-600 mt-2">Recargando página…</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-rose-800">
                          {result.error || 'No se pudo completar la importación'}
                        </p>
                      </>
                    )}

                    {result.errors && result.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                          Ver {result.errors.length} {result.errors.length === 1 ? 'error' : 'errores'}
                        </summary>
                        <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-2">
                          {result.errors.slice(0, 20).map((e, i) => (
                            <li key={i} className="text-[11px] text-slate-600 font-mono">
                              {e.row > 0 ? `Fila ${e.row}` : e.code ?? '?'}: {e.message}
                            </li>
                          ))}
                          {result.errors.length > 20 && (
                            <li className="text-[11px] text-slate-500 italic">
                              … y {result.errors.length - 20} más
                            </li>
                          )}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {result?.ok ? 'Cerrar' : 'Cancelar'}
              </button>
              {file && !result?.ok && (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importar
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 text-center">
              Filas con código existente se actualizan · filas sin código o nombre se omiten
            </p>
          </div>
        </div>
      )}
    </>
  );
}
