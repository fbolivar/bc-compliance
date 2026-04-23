'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { importRiskMatrix, type RiskImportResult } from '../actions/importRiskActions';

interface Props {
  /** Optional process to fall back to when a row has no matching "Proceso" column. */
  fallbackProcessId?: string;
  fallbackProcessName?: string;
}

export function RiskImportButton({ fallbackProcessId, fallbackProcessName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<RiskImportResult | null>(null);
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
    if (fallbackProcessId) fd.append('fallback_process_id', fallbackProcessId);
    startTransition(async () => {
      const res = await importRiskMatrix(fd);
      setResult(res);
      if (res.ok && (res.risksInserted ?? 0) > 0) {
        setTimeout(() => window.location.reload(), 2500);
      }
    });
  }

  const insertedTotal = (result?.risksInserted ?? 0) + (result?.controlsInserted ?? 0);
  const summaryBgOk = insertedTotal > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200';
  const summaryTxtOk = insertedTotal > 0 ? 'text-emerald-800' : 'text-amber-800';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Upload className="w-4 h-4 text-sky-600" />
        Importar Matriz DAFP
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Importar matriz de riesgos DAFP"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Importar matriz de riesgos</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Formato DAFP 2020 (Decreto 2106/2019 — MIPG). Hoja "Riesgos".
                  {fallbackProcessName && (
                    <>
                      <br />
                      <span className="text-xs">Filas sin proceso se asignan a: <span className="font-medium text-slate-700">{fallbackProcessName}</span></span>
                    </>
                  )}
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

            {!file && !result && (
              <label
                htmlFor="risk-import-file"
                className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-sky-400 hover:bg-sky-50/50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Selecciona un archivo .xlsx</p>
                <p className="text-xs text-slate-500 mt-1">Máximo 10 MB</p>
                <input
                  ref={inputRef}
                  id="risk-import-file"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={onSelect}
                />
              </label>
            )}

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

            {result && (
              <div className={`rounded-xl p-4 mb-4 border ${
                result.ok ? summaryBgOk : 'bg-rose-50 border-rose-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.ok ? (
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${insertedTotal > 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    {result.ok ? (
                      <>
                        <p className={`text-sm font-semibold ${summaryTxtOk}`}>
                          {insertedTotal > 0 ? 'Importación completada' : 'No se insertaron registros'}
                        </p>
                        <p className={`text-xs mt-1 ${insertedTotal > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          <strong>{result.risksInserted ?? 0}</strong> riesgos ·{' '}
                          <strong>{result.controlsInserted ?? 0}</strong> controles ·{' '}
                          <strong>{result.mappingsInserted ?? 0}</strong> vínculos
                          {(result.risksSkipped ?? 0) > 0 && <> · {result.risksSkipped} duplicados</>}
                          {(result.rejected ?? 0) > 0 && <> · {result.rejected} rechazados</>}
                        </p>
                        {insertedTotal > 0 && (
                          <p className="text-xs text-emerald-600 mt-2">Recargando página…</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-rose-800">
                        {result.error || 'No se pudo completar la importación'}
                      </p>
                    )}

                    {result.errors && result.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                          Ver {result.errors.length} {result.errors.length === 1 ? 'problema' : 'problemas'}
                        </summary>
                        <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-2">
                          {result.errors.slice(0, 30).map((e, i) => (
                            <li key={i} className="text-[11px] text-slate-600 font-mono">
                              {e.row > 0 ? `Fila ${e.row}` : (e.code ?? '?')}: {e.message}
                            </li>
                          ))}
                          {result.errors.length > 30 && (
                            <li className="text-[11px] text-slate-500 italic">
                              … y {result.errors.length - 30} más
                            </li>
                          )}
                        </ul>
                      </details>
                    )}

                    {result.diagnostic && (
                      <details className="mt-2">
                        <summary className="text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                          Detalle técnico
                        </summary>
                        <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                          <p><strong>Hoja:</strong> {result.diagnostic.sheetName}</p>
                          <p><strong>Cabecera:</strong> {result.diagnostic.headerRow > 0 ? `fila ${result.diagnostic.headerRow}` : 'no detectada'}</p>
                          <p><strong>Filas leídas:</strong> {result.diagnostic.rowsScanned}</p>
                          <p><strong>Riesgos únicos:</strong> {result.diagnostic.uniqueRiskNumbers}</p>
                          <p><strong>Proceso por columna:</strong> {result.diagnostic.processMatched} · <strong>por fallback:</strong> {result.diagnostic.processFallback}</p>
                          <p><strong>Amenazas creadas:</strong> {result.diagnostic.threatCreated}</p>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                    <><Loader2 className="w-4 h-4 animate-spin" />Procesando…</>
                  ) : (
                    <><Upload className="w-4 h-4" />Importar</>
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 text-center">
              Filas con mismo "Número del Riesgo" se agrupan como un solo riesgo con N controles.
              Riesgos con código duplicado se omiten.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
