'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Globe, Users, Mail, CheckCircle2,
  ChevronRight, ChevronLeft, Layers, Shield,
  FileCheck, Activity, ArrowRight,
} from 'lucide-react';
import { saveOrgProfile, saveFrameworkSelection, completeOnboarding } from '../actions/onboardingActions';

const INDUSTRIES = [
  'Banca y Finanzas', 'Seguros', 'Gobierno y Sector Público', 'Salud',
  'Tecnología', 'Telecomunicaciones', 'Energía y Utilities', 'Retail',
  'Manufactura', 'Educación', 'Otro',
];

const COUNTRIES = [
  'Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador',
  'Venezuela', 'España', 'Estados Unidos', 'Otro',
];

const EMPLOYEE_RANGES = [
  { value: '1', label: '1–10 empleados' },
  { value: '25', label: '11–50 empleados' },
  { value: '100', label: '51–200 empleados' },
  { value: '500', label: '201–1000 empleados' },
  { value: '2000', label: 'Más de 1000 empleados' },
];

const FRAMEWORKS = [
  {
    id: 'iso27001',
    label: 'ISO 27001:2022',
    desc: 'Sistema de Gestión de Seguridad de la Información',
    icon: Shield,
    color: 'sky',
  },
  {
    id: 'soc2',
    label: 'SOC 2 Type II',
    desc: 'Controles de Seguridad, Disponibilidad y Confidencialidad',
    icon: FileCheck,
    color: 'violet',
  },
  {
    id: 'nist',
    label: 'NIST CSF',
    desc: 'Framework de Ciberseguridad del NIST',
    icon: Layers,
    color: 'teal',
  },
  {
    id: 'pci_dss',
    label: 'PCI DSS',
    desc: 'Estándar de Seguridad de Datos de la Industria de Tarjetas',
    icon: Activity,
    color: 'amber',
  },
];

const STEPS = ['Perfil', 'Marcos', 'Listo'];

interface Props {
  orgName: string;
}

export function SetupWizard({ orgName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0 state
  const [name, setName] = useState(orgName);
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [employeeCount, setEmployeeCount] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Step 1 state
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['iso27001']);

  async function handleProfileNext() {
    if (!name.trim()) { setError('El nombre de la organización es requerido'); return; }
    setLoading(true);
    setError(null);
    const result = await saveOrgProfile({ name, industry, country, employee_count: employeeCount, contact_email: contactEmail });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setStep(1);
  }

  async function handleFrameworkNext() {
    setLoading(true);
    setError(null);
    const result = await saveFrameworkSelection({ frameworks: selectedFrameworks });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setStep(2);
  }

  async function handleFinish(goToWizard: boolean) {
    setLoading(true);
    await completeOnboarding();
    setLoading(false);
    router.push(goToWizard ? '/iso-wizard' : '/dashboard');
  }

  function toggleFramework(id: string) {
    setSelectedFrameworks(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo + progress */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">BC Trust GRC</span>
          </div>
          {/* Step pills */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  i === step ? 'bg-sky-500 text-white' :
                  i < step ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-700 text-slate-500'
                }`}>
                  {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full border border-current text-[9px]">{i + 1}</span>}
                  {s}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-sky-500' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Step 0: Org Profile */}
          {step === 0 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Perfil de tu organización</h2>
                  <p className="text-sm text-slate-500">Completa los datos básicos para personalizar BC Trust</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">Nombre de la organización *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all"
                    placeholder="Acme Corp S.A.S."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
                      <Globe className="w-3 h-3 inline mr-1" />País
                    </label>
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all bg-white"
                    >
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
                      <Users className="w-3 h-3 inline mr-1" />Tamaño
                    </label>
                    <select
                      value={employeeCount}
                      onChange={e => setEmployeeCount(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {EMPLOYEE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">Industria</label>
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all bg-white"
                  >
                    <option value="">Seleccionar industria...</option>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
                    <Mail className="w-3 h-3 inline mr-1" />Correo de contacto
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all"
                    placeholder="seguridad@empresa.com"
                  />
                </div>

                {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-lg">{error}</p>}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleProfileNext}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Framework Selection */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Marcos normativos</h2>
                  <p className="text-sm text-slate-500">Selecciona los estándares que quieres gestionar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {FRAMEWORKS.map(fw => {
                  const Icon = fw.icon;
                  const selected = selectedFrameworks.includes(fw.id);
                  return (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => toggleFramework(fw.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-sky-400 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-sky-500' : 'bg-slate-100'}`}>
                        <Icon className={`w-4 h-4 ${selected ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">{fw.label}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{fw.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-lg mb-4">{error}</p>}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </button>
                <button
                  onClick={handleFrameworkNext}
                  disabled={loading || selectedFrameworks.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Todo listo!</h2>
              <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
                Tu organización está configurada. Ahora elige cómo quieres empezar:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                <button
                  onClick={() => handleFinish(false)}
                  disabled={loading}
                  className="flex flex-col gap-2 p-5 rounded-xl border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all disabled:opacity-50 text-left"
                >
                  <Activity className="w-6 h-6 text-sky-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Ir al Dashboard</p>
                    <p className="text-xs text-slate-500 mt-0.5">Ver el panel principal y explorar la plataforma</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 self-end" />
                </button>

                <button
                  onClick={() => handleFinish(true)}
                  disabled={loading}
                  className="flex flex-col gap-2 p-5 rounded-xl border-2 border-sky-400 bg-sky-50 hover:bg-sky-100 transition-all disabled:opacity-50 text-left"
                >
                  <Shield className="w-6 h-6 text-sky-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Implementar ISO 27001</p>
                    <p className="text-xs text-slate-500 mt-0.5">Iniciar el asistente guiado de implementación</p>
                  </div>
                  <div className="flex items-center gap-1 self-end">
                    <span className="text-[10px] font-medium text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">Recomendado</span>
                    <ArrowRight className="w-4 h-4 text-sky-500" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          BC Trust GRC · Plataforma de Gestión de Riesgos y Cumplimiento
        </p>
      </div>
    </div>
  );
}
