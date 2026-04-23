'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Loader2 } from 'lucide-react';
import { updateRisk } from '../actions/riskActions';
import { createClient } from '@/lib/supabase/client';
import type { RiskRow } from '../services/riskService';
import { DafpRiskMatrix } from './DafpRiskMatrix';

interface Props {
  risk: RiskRow;
}

const PROBABILITY_OPTIONS = [
  { label: 'Muy Baja', value: 0.2 },
  { label: 'Baja', value: 0.4 },
  { label: 'Media', value: 0.6 },
  { label: 'Alta', value: 0.8 },
  { label: 'Muy Alta', value: 1.0 },
];

const IMPACT_OPTIONS = [
  { label: 'Leve', value: 0.2 },
  { label: 'Menor', value: 0.4 },
  { label: 'Moderado', value: 0.6 },
  { label: 'Mayor', value: 0.8 },
  { label: 'Catastrófico', value: 1.0 },
];

const TREATMENTS = [
  { value: 'mitigate', label: 'Reducir / Mitigar' },
  { value: 'transfer', label: 'Transferir' },
  { value: 'accept', label: 'Aceptar' },
  { value: 'avoid', label: 'Evitar' },
  { value: 'share', label: 'Compartir' },
];

function computeZone(probValue: number, impValue: number): string {
  const score = probValue * impValue;
  if (score >= 0.6) return 'Extremo';
  if (score >= 0.3) return 'Alto';
  if (score >= 0.12) return 'Moderado';
  return 'Bajo';
}

function zoneToLevel(zone: string): 'critical' | 'high' | 'medium' | 'low' | 'negligible' {
  switch (zone) {
    case 'Extremo': return 'critical';
    case 'Alto': return 'high';
    case 'Moderado': return 'medium';
    case 'Bajo': return 'low';
    default: return 'medium';
  }
}

type Option = { value: string; label: string };

export function RiskEditForm({ risk }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [processes, setProcesses] = useState<Option[]>([]);
  const [assets, setAssets] = useState<Option[]>([]);
  const [threats, setThreats] = useState<Option[]>([]);

  // Controlled state for the DAFP analysis pair (to drive the matrix preview)
  const [probabilityLabel, setProbabilityLabel] = useState(risk.probability_label ?? '');
  const [impactLabel, setImpactLabel] = useState(risk.impact_label ?? '');

  const probValue = PROBABILITY_OPTIONS.find((o) => o.label === probabilityLabel)?.value ?? null;
  const impValue = IMPACT_OPTIONS.find((o) => o.label === impactLabel)?.value ?? null;
  const liveZone = probValue !== null && impValue !== null ? computeZone(probValue, impValue) : null;

  useEffect(() => {
    const supabase = createClient();

    // Processes (child categories)
    supabase
      .from('asset_categories')
      .select('id, name')
      .not('parent_id', 'is', null)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setProcesses((data || []).map((p) => ({ value: p.id, label: p.name })));
      });

    supabase
      .from('assets')
      .select('id, code, name')
      .order('code')
      .limit(500)
      .then(({ data }) => {
        setAssets((data || []).map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })));
      });

    supabase
      .from('threat_catalog')
      .select('id, code, name')
      .order('code')
      .then(({ data }) => {
        setThreats((data || []).map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` })));
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Inject computed DAFP values + MAGERIT-compatible fields based on the selected labels
    if (probValue !== null) {
      formData.set('probability_value', String(probValue));
      // MAGERIT frequency 0-5 from probability: 0.2→1, 0.4→2, 0.6→3, 0.8→4, 1.0→5
      const freq = probValue === 1.0 ? 5 : probValue === 0.8 ? 4 : probValue === 0.6 ? 3 : probValue === 0.4 ? 2 : 1;
      formData.set('frequency', String(freq));
    }
    if (impValue !== null) {
      formData.set('impact_value', String(impValue));
      // MAGERIT degradation across CIA from impact %
      const deg = Math.round(impValue * 100);
      formData.set('degradation_c', String(deg));
      formData.set('degradation_i', String(deg));
      formData.set('degradation_a', String(deg));
    }
    if (liveZone) {
      formData.set('risk_zone', liveZone);
      // Keep risk_level_inherent in sync (used by dashboards)
      // Note: DB column is an enum; updateEntity will cast
      formData.set('risk_level_inherent', zoneToLevel(liveZone));
      formData.set('risk_level_residual', zoneToLevel(liveZone));
    }

    const result = await updateRisk(risk.id, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/risks/${risk.id}`);
        router.refresh();
      }, 1000);
    }
    setLoading(false);
  }

  const inputClass =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <p className="text-sm text-emerald-700 font-medium">Cambios guardados</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600" role="alert">
          {error}
        </div>
      )}

      {/* 1. Identificación */}
      <fieldset className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <legend className="text-sm font-semibold text-slate-800 px-2">1. Identificación del Riesgo</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="code" className={labelClass}>Código *</label>
            <input id="code" name="code" required defaultValue={risk.code} className={inputClass} />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="name" className={labelClass}>Nombre del Riesgo *</label>
            <input id="name" name="name" required defaultValue={risk.name} className={inputClass} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="description" className={labelClass}>Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={risk.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="risk_type" className={labelClass}>Tipo de Riesgo</label>
            <input
              id="risk_type"
              name="risk_type"
              defaultValue={risk.risk_type ?? ''}
              placeholder="Ej: Seguridad información / digital"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="category_id" className={labelClass}>Proceso</label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={risk.category_id ?? ''}
              className={inputClass}
            >
              <option value="">— Sin proceso —</option>
              {processes.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="asset_id" className={labelClass}>Activo (opcional)</label>
            <select
              id="asset_id"
              name="asset_id"
              defaultValue={risk.asset_id ?? ''}
              className={inputClass}
            >
              <option value="">— Nivel de proceso (sin activo específico) —</option>
              {assets.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="threat_id" className={labelClass}>Amenaza *</label>
            <select
              id="threat_id"
              name="threat_id"
              required
              defaultValue={risk.threat_id ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona amenaza —</option>
              {threats.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="causes" className={labelClass}>Causas / Vulnerabilidades</label>
            <textarea
              id="causes"
              name="causes"
              rows={2}
              defaultValue={risk.causes ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="consequences" className={labelClass}>Consecuencias</label>
            <textarea
              id="consequences"
              name="consequences"
              rows={2}
              defaultValue={risk.consequences ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </fieldset>

      {/* 2. Análisis */}
      <fieldset className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <legend className="text-sm font-semibold text-slate-800 px-2">2. Análisis del Riesgo (DAFP)</legend>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity_frequency" className={labelClass}>Frecuencia actividad</label>
              <input
                id="activity_frequency"
                name="activity_frequency"
                type="number"
                min={0}
                defaultValue={risk.activity_frequency ?? ''}
                placeholder="Ej: 8760 (h/año)"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="probability_label" className={labelClass}>Probabilidad Inherente</label>
              <select
                id="probability_label"
                name="probability_label"
                value={probabilityLabel}
                onChange={(e) => setProbabilityLabel(e.target.value)}
                className={inputClass}
              >
                <option value="">— Selecciona —</option>
                {PROBABILITY_OPTIONS.map((o) => (
                  <option key={o.label} value={o.label}>{o.label} ({(o.value * 100).toFixed(0)}%)</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="impact_label" className={labelClass}>Impacto Inherente</label>
              <select
                id="impact_label"
                name="impact_label"
                value={impactLabel}
                onChange={(e) => setImpactLabel(e.target.value)}
                className={inputClass}
              >
                <option value="">— Selecciona —</option>
                {IMPACT_OPTIONS.map((o) => (
                  <option key={o.label} value={o.label}>{o.label} ({(o.value * 100).toFixed(0)}%)</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="liveZone" className={labelClass}>Zona de Riesgo (calculada)</label>
              <input
                id="liveZone"
                type="text"
                readOnly
                value={liveZone ?? '—'}
                className={`${inputClass} bg-slate-50 font-semibold`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="treatment" className={labelClass}>Tratamiento</label>
              <select
                id="treatment"
                name="treatment"
                defaultValue={risk.treatment ?? 'mitigate'}
                className={inputClass}
              >
                {TREATMENTS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="treatment_justification" className={labelClass}>Justificación del Tratamiento</label>
              <textarea
                id="treatment_justification"
                name="treatment_justification"
                rows={2}
                defaultValue={risk.treatment_justification ?? ''}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <DafpRiskMatrix probabilityValue={probValue} impactValue={impValue} zone={liveZone} />
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push(`/risks/${risk.id}`)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
