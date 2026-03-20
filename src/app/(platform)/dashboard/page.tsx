import React from 'react';
import { Shield, ShieldAlert, Server, Bug, AlertTriangle, CheckSquare } from 'lucide-react';

// Mock data for now - will be replaced with real data
const kpis = [
  { label: 'Cumplimiento Global', value: '78%', icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { label: 'Riesgo Residual', value: '32%', icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { label: 'Activos Registrados', value: '247', icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
  { label: 'Vulnerabilidades Críticas', value: '12', icon: Bug, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  { label: 'Incidentes Activos', value: '3', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { label: 'Controles Implementados', value: '156/203', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
];

const frameworkCompliance = [
  { name: 'ISO 27001:2022', percentage: 82, color: 'bg-emerald-500' },
  { name: 'Ley 1581 (Datos)', percentage: 88, color: 'bg-emerald-500' },
  { name: 'NIST CSF 2.0', percentage: 75, color: 'bg-cyan-500' },
  { name: 'GDPR', percentage: 71, color: 'bg-cyan-500' },
  { name: 'PCI DSS 4.0', percentage: 68, color: 'bg-amber-500' },
  { name: 'NIS2 Directive', percentage: 45, color: 'bg-rose-500' },
];

const riskDistribution = [
  { level: 'Crítico', count: 4, color: 'bg-rose-500', textColor: 'text-rose-400' },
  { level: 'Alto', count: 12, color: 'bg-orange-500', textColor: 'text-orange-400' },
  { level: 'Medio', count: 28, color: 'bg-amber-500', textColor: 'text-amber-400' },
  { level: 'Bajo', count: 45, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { level: 'Despreciable', count: 18, color: 'bg-slate-500', textColor: 'text-slate-400' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Centro de Comando</h1>
        <p className="mt-1 text-sm text-slate-400">
          Visión unificada del estado de ciberseguridad y cumplimiento normativo
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`rounded-xl border ${kpi.border} ${kpi.bg} p-5 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{kpi.label}</p>
                  <p className={`mt-2 text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
                <div className={`rounded-lg ${kpi.bg} p-3`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Framework */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            Cumplimiento por Framework
          </h2>
          <div className="space-y-4">
            {frameworkCompliance.map((fw) => (
              <div key={fw.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400">{fw.name}</span>
                  <span className="text-sm font-medium text-slate-300">{fw.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full w-[var(--bar-width)] ${fw.color} transition-all`}
                    style={{ '--bar-width': `${fw.percentage}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            Distribución de Riesgos
          </h2>
          <div className="space-y-3">
            {riskDistribution.map((risk) => (
              <div key={risk.level} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                <span className="text-sm text-slate-400 w-28">{risk.level}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full w-[var(--bar-width)] ${risk.color} transition-all`}
                    style={{ '--bar-width': `${((risk.count / 107) * 100).toFixed(1)}%` } as React.CSSProperties}
                  />
                </div>
                <span className={`text-sm font-medium ${risk.textColor} w-8 text-right`}>
                  {risk.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total escenarios de riesgo</span>
              <span className="font-medium text-slate-300">107</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
