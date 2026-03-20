'use client';

import { useState, useRef } from 'react';
import { Upload, FileUp, X, Check, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

const supportedFormats = [
  { ext: '.nessus', label: 'Nessus', desc: 'Archivos de escaneo Tenable Nessus' },
  { ext: '.csv', label: 'CSV', desc: 'Columnas: name, severity, cvss_score, cve_id' },
  { ext: '.json', label: 'JSON', desc: 'Array de objetos con name, severity, cvss_score' },
];

interface ParsedVuln {
  name: string;
  description: string | null;
  severity: string;
  cvss_score: number | null;
  cve_id: string | null;
}

function mapNessusSeverity(level: number): string {
  switch (level) {
    case 4: return 'critical';
    case 3: return 'high';
    case 2: return 'medium';
    case 1: return 'low';
    default: return 'informational';
  }
}

function cvssToSeverity(score: number): string {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'informational';
}

function parseNessusClient(xml: string): ParsedVuln[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('ReportItem');
  const vulns: ParsedVuln[] = [];
  const seen = new Set<string>();

  items.forEach(item => {
    const severity = parseInt(item.getAttribute('severity') || '0');
    const pluginName = item.getAttribute('pluginName') || 'Unknown';
    const cve = item.querySelector('cve')?.textContent || null;

    if (severity === 0 && !cve) return;

    const key = `${pluginName}|${cve || ''}`;
    if (seen.has(key)) return;
    seen.add(key);

    const description = item.querySelector('description')?.textContent || item.querySelector('synopsis')?.textContent || null;
    const cvss = item.querySelector('cvss3_base_score')?.textContent || item.querySelector('cvss_base_score')?.textContent || null;

    vulns.push({
      name: pluginName.substring(0, 500),
      description: description ? description.substring(0, 2000) : null,
      severity: mapNessusSeverity(severity),
      cvss_score: cvss ? parseFloat(cvss) : null,
      cve_id: cve,
    });
  });

  return vulns;
}

function parseCSVClient(content: string): ParsedVuln[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += char;
    }
    values.push(current.trim());

    const get = (field: string) => {
      const idx = headers.indexOf(field);
      return idx >= 0 && values[idx] ? values[idx] : null;
    };

    const cvss = get('cvss_score') || get('cvss');
    const severity = get('severity') || (cvss ? cvssToSeverity(parseFloat(cvss)) : 'medium');

    return {
      name: get('name') || get('title') || get('plugin_name') || 'Sin nombre',
      description: get('description') || get('synopsis') || null,
      severity: severity.toLowerCase(),
      cvss_score: cvss ? parseFloat(cvss) : null,
      cve_id: get('cve_id') || get('cve') || null,
    };
  }).filter(v => v.name !== 'Sin nombre' || v.cve_id);
}

function parseJSONClient(content: string): ParsedVuln[] {
  try {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : data.vulnerabilities || data.results || data.findings || [data];

    return items.map((item: Record<string, unknown>) => {
      const cvss = item.cvss_score || item.cvss || item.cvss3_score;
      const severity = (item.severity || item.risk || '') as string;

      return {
        name: ((item.name || item.title || 'Sin nombre') as string).substring(0, 500),
        description: item.description ? String(item.description).substring(0, 2000) : null,
        severity: severity.toLowerCase() || (cvss ? cvssToSeverity(Number(cvss)) : 'medium'),
        cvss_score: cvss ? Number(cvss) : null,
        cve_id: (item.cve_id || item.cve || null) as string | null,
      };
    }).filter((v: ParsedVuln) => v.name !== 'Sin nombre');
  } catch {
    return [];
  }
}

export function VulnImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const [result, setResult] = useState<{ inserted: number; errors: number; format: string; total: number } | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    setResult(null);
    setParseStatus('Leyendo archivo...');

    try {
      const content = await file.text();
      const fileName = file.name.toLowerCase();

      // Parse in browser
      let parsed: ParsedVuln[] = [];
      let format = '';

      setParseStatus('Analizando contenido...');

      if (fileName.endsWith('.nessus') || fileName.endsWith('.xml')) {
        parsed = parseNessusClient(content);
        format = 'Nessus (.nessus)';
      } else if (fileName.endsWith('.csv')) {
        parsed = parseCSVClient(content);
        format = 'CSV';
      } else if (fileName.endsWith('.json')) {
        parsed = parseJSONClient(content);
        format = 'JSON';
      } else {
        setError('Formato no soportado. Use .nessus, .csv o .json');
        setUploading(false);
        return;
      }

      if (parsed.length === 0) {
        setError('No se encontraron vulnerabilidades en el archivo');
        setUploading(false);
        return;
      }

      setParseStatus(`${parsed.length} vulnerabilidades encontradas. Importando...`);

      // Send parsed data as JSON (small payload)
      const res = await fetch('/api/vulnerabilities/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerabilities: parsed, format }),
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
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    }

    setUploading(false);
    setParseStatus('');
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

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

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
              <p className="text-sm text-slate-600">{parseStatus || 'Procesando...'}</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400" />
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Arrastra un archivo aqui o <span className="text-sky-500 font-medium">haz click para seleccionar</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos: .nessus, .csv, .json (sin limite de tamano)
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
