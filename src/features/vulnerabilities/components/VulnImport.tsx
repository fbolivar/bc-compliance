'use client';

import { useState, useRef } from 'react';
import { Upload, FileUp, X, Check, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

const supportedFormats = [
  { ext: '.nessus', label: 'Nessus', desc: 'Archivos de escaneo Tenable Nessus' },
  { ext: '.csv', label: 'CSV', desc: 'Columnas: name, severity, cvss_score, cve_id' },
  { ext: '.json', label: 'JSON', desc: 'Array de objetos con name, severity, cvss_score' },
];

export function VulnImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: number; format: string; total: number } | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/vulnerabilities/import', {
        method: 'POST',
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError(`Error del servidor (${res.status})`);
        setUploading(false);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || `Error al importar (${res.status})`);
      } else {
        setResult(data);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexion al importar');
    }

    setUploading(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Upload className="w-4 h-4 text-sky-500" />
        Importar
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileUp className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-slate-700">Importar Vulnerabilidades</h3>
        </div>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setResult(null); setError(''); }}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Supported formats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {supportedFormats.map(f => (
            <div key={f.ext} className="flex items-start gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-700">{f.label} <span className="text-slate-400 font-normal">({f.ext})</span></p>
                <p className="text-[11px] text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {result.inserted} vulnerabilidades importadas desde {result.format}
              </p>
              {result.errors > 0 && (
                <p className="text-xs text-amber-600 mt-1">{result.errors} registros con error</p>
              )}
              <p className="text-xs text-emerald-600 mt-1">{result.total} encontradas en el archivo</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            dragOver
              ? 'border-sky-400 bg-sky-50'
              : 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50/50'
          }`}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm text-slate-600">Procesando archivo...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400" />
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Arrastra un archivo aqui o <span className="text-sky-500 font-medium">haz click para seleccionar</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos: .nessus, .csv, .json
                </p>
              </div>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".nessus,.xml,.csv,.json"
            onChange={onFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}
