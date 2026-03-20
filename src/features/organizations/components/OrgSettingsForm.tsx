'use client';

import { useState } from 'react';
import { updateOrganization } from '@/actions/organization';
import { Building2, Save, Loader2 } from 'lucide-react';

interface OrgData {
  id: string;
  name: string;
  slug: string;
  tax_id: string | null;
  industry: string | null;
  country: string | null;
  address: string | null;
  plan: string;
}

interface OrgSettingsFormProps {
  organization: OrgData;
}

const industries = [
  'Banca y Finanzas',
  'Gobierno',
  'Telecomunicaciones',
  'Salud',
  'Energia',
  'Tecnologia',
  'Educacion',
  'Retail',
  'Manufactura',
  'Seguros',
  'Transporte',
  'Otra',
];

const countries = [
  'Colombia', 'Mexico', 'Chile', 'Peru', 'Argentina', 'Ecuador',
  'Panama', 'Costa Rica', 'Republica Dominicana', 'Espana', 'Estados Unidos', 'Otro',
];

export function OrgSettingsForm({ organization }: OrgSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set('org_id', organization.id);
    const result = await updateOrganization(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Organizacion actualizada exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-2.5 sm:py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nombre de la organizacion</label>
          <input type="text" name="name" defaultValue={organization.name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Slug (URL)</label>
          <input
            type="text"
            name="slug"
            defaultValue={organization.slug}
            required
            pattern="[a-z0-9-]+"
            title="Solo letras minusculas, numeros y guiones"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>NIT / Tax ID</label>
          <input
            type="text"
            name="tax_id"
            defaultValue={organization.tax_id || ''}
            placeholder="900.123.456-7"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Industria</label>
          <select name="industry" defaultValue={organization.industry || ''} className={inputClass}>
            <option value="">Seleccionar...</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Pais</label>
          <select name="country" defaultValue={organization.country || ''} className={inputClass}>
            <option value="">Seleccionar...</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Direccion</label>
          <input
            type="text"
            name="address"
            defaultValue={organization.address || ''}
            placeholder="Calle 100 #10-20"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Building2 className="w-4 h-4" />
          <span>Plan: <span className="text-cyan-400 capitalize">{organization.plan}</span></span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 sm:py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 rounded-lg transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
