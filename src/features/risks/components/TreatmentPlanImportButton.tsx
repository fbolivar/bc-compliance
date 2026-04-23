'use client';

import { useRef, useState, useTransition } from 'react';
import { ClipboardList, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  importTreatmentPlans,
  type TreatmentPlanImportResult,
} from '../actions/importTreatmentPlanActions';

export function TreatmentPlanImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TreatmentPlanImportResult | null>(null);
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
      const res = await importTreatmentPlans(fd);
      setResult(res);
      if (res.ok && (res.plansInserted ?? 0) > 0) {
        setTimeout(() => window.location.reload(), 2500);
      }
    });
  }

  const inserted = result?.plansInserted ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <ClipboardList className="w-4 h-4 text-indigo-500" />
        Importar planes
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Importar planes de tratamiento</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Reutiliza la misma matriz DAFP. Un plan por riesgo (columnas Plan de Acción, fechas, responsable).
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
                htmlFor="plan-import-file"
                className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Selecciona un archivo .xlsx</p>
                <p className="text-xs text-slate-500 mt-1">El mismo archivo que cargaste para la matriz de riesgos</p>
                <input
                  ref={inputRef}
                  id="plan-import-file"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={onSelect}
                />
              </label>
            )}

            {file && !result && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500 flex-shrink-0" />
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
                result.ok && inserted > 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : result.ok
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-rose-50 border-rose-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.ok ? (
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${inserted > 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    {result.ok ? (
                      <>
                        <p className={`text-sm font-semibold ${inserted > 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {inserted > 0 ? 'Importación completada' : 'No se crearon planes nuevos'}
                        </p>
                        <p className={`text-xs mt-1 ${inserted > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          <strong>{result.plansInserted ?? 0}</strong> planes ·{' '}
                          <strong>{result.actionsInserted ?? 0}</strong> acciones ·{' '}
                          <strong>{result.linksInserted ?? 0}</strong> vínculos
                          {(result.plansSkipped ?? 0) > 0 && <> · {result.plansSkipped} duplicados</>}
                        </p>
                        {inserted > 0 && <p className="text-xs text-emerald-600 mt-2">Recargando página…</p>}
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
                              Fila {e.row}: {e.message}
                            </li>
                          ))}
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
                          <p><strong>Cabecera:</strong> fila {result.diagnostic.headerRow}</p>
                          <p><strong>Filas leídas:</strong> {result.diagnostic.rowsScanned}</p>
                          <p><strong>Riesgos únicos:</strong> {result.diagnostic.uniqueRiskNumbers}</p>
                          <p><strong>Riesgos no encontrados:</strong> {result.diagnostic.risksNotFound}</p>
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
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Procesando…</>
                  ) : (
                    <><ClipboardList className="w-4 h-4" />Importar</>
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 text-center">
              Planes con código duplicado (TP-R-001, etc.) se omiten. Primero debes tener los riesgos cargados.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
