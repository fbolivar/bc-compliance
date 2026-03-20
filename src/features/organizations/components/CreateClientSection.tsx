'use client';

import { useState } from 'react';
import { createClientOrg } from '@/actions/clients';
import { FormModal } from '@/shared/components/FormModal';
import { Building2, Plus, Copy, Check, Loader2, Mail, User, Globe } from 'lucide-react';

const industries = [
  'Banca y Finanzas', 'Gobierno', 'Telecomunicaciones', 'Salud',
  'Energia', 'Tecnologia', 'Educacion', 'Retail', 'Manufactura',
  'Seguros', 'Transporte', 'Otra',
];

const countries = [
  'Colombia', 'Mexico', 'Chile', 'Peru', 'Argentina', 'Ecuador',
  'Panama', 'Costa Rica', 'Republica Dominicana', 'Espana', 'Estados Unidos', 'Otro',
];

const plans = [
  { value: 'starter', label: 'Starter', desc: 'Hasta 5 usuarios, 100 activos' },
  { value: 'professional', label: 'Professional', desc: 'Hasta 25 usuarios, 1000 activos' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Usuarios y activos ilimitados' },
];

export function CreateClientSection() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const response = await createClientOrg(formData);

    if (response.error) {
      setError(response.error);
    } else if (response.tempPassword) {
      setResult({ email, password: response.tempPassword });
    }
    setLoading(false);
  };

  const copyCredentials = async () => {
    if (!result) return;
    const text = `BC Compliance - Credenciales de acceso\n\nURL: ${window.location.origin}\nEmail: ${result.email}\nPassword temporal: ${result.password}\n\nPor favor cambia tu password al iniciar sesion.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShowForm(false);
    setError('');
    setResult(null);
    setCopied(false);
  };

  const inputClass = "w-full px-4 py-2.5 sm:py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50";

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Crear cliente
      </button>

      <FormModal isOpen={showForm} onClose={handleClose} title="Crear Nueva Organizacion Cliente">
        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400 font-medium mb-3">Cliente creado exitosamente</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200 font-mono">{result.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Password temporal:</span>
                  <span className="text-slate-200 font-mono">{result.password}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Envia estas credenciales al cliente. Se le pedira cambiar el password al iniciar sesion.
            </p>
            <div className="flex gap-3">
              <button
                onClick={copyCredentials}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar credenciales'}
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Nombre de la organizacion *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" name="org_name" required placeholder="Empresa ABC S.A.S." className={`${inputClass} pl-10`} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email del admin *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" name="email" required placeholder="admin@empresa.com" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nombre del contacto
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="contact_name" placeholder="Juan Perez" className={`${inputClass} pl-10`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Industria</label>
                <select name="industry" className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Pais</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select name="country" className={`${inputClass} pl-10`}>
                    <option value="">Seleccionar...</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan</label>
              <div className="space-y-2">
                {plans.map(p => (
                  <label
                    key={p.value}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors has-[:checked]:border-cyan-500/50 has-[:checked]:bg-cyan-500/5"
                  >
                    <input type="radio" name="plan" value={p.value} defaultChecked={p.value === 'starter'} className="mt-0.5 accent-cyan-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.label}</p>
                      <p className="text-xs text-slate-500">{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? 'Creando...' : 'Crear cliente'}
              </button>
            </div>
          </form>
        )}
      </FormModal>
    </>
  );
}
