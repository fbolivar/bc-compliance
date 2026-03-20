import React from 'react';
import { requireOrg } from '@/shared/lib/get-org';
import { countRecords } from '@/shared/lib/service-helpers';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { createClient } from '@/lib/supabase/server';
import { Shield, ShieldAlert, Server, Bug, AlertTriangle, CheckSquare, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const [
    assetCount,
    totalRisks,
    criticalRisks,
    highRisks,
    openVulns,
    activeIncidents,
    implementedControls,
    totalControls,
    openNCs,
    docCount,
    memberCount,
    frameworks,
  ] = await Promise.all([
    countRecords('assets', orgId),
    countRecords('risk_scenarios', orgId),
    countRecords('risk_scenarios', orgId, { risk_level: 'critical' }),
    countRecords('risk_scenarios', orgId, { risk_level: 'high' }),
    countRecords('vulnerabilities', orgId, { status: 'open' }),
    countRecords('incidents', orgId, { status: 'detected' }),
    countRecords('controls', orgId, { status: 'implemented' }),
    countRecords('controls', orgId),
    countRecords('nonconformities', orgId, { status: 'open' }),
    countRecords('documents', orgId),
    supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .then(({ count }) => count || 0),
    getFrameworksWithCompliance(orgId),
  ]);

  const controlsRatio = totalControls > 0
    ? `${implementedControls}/${totalControls}`
    : '0/0';

  const avgCompliance = frameworks.length > 0
    ? Math.round(frameworks.reduce((sum, fw) => sum + fw.compliance_percentage, 0) / frameworks.length)
    : 0;

  const kpis = [
    {
      label: 'Cumplimiento Global',
      value: `${avgCompliance}%`,
      href: '/compliance',
      icon: CheckSquare,
      color: avgCompliance >= 70 ? 'text-emerald-400' : avgCompliance >= 50 ? 'text-amber-400' : 'text-rose-400',
      bg: avgCompliance >= 70 ? 'bg-emerald-400/10' : avgCompliance >= 50 ? 'bg-amber-400/10' : 'bg-rose-400/10',
      border: avgCompliance >= 70 ? 'border-emerald-400/20' : avgCompliance >= 50 ? 'border-amber-400/20' : 'border-rose-400/20',
    },
    {
      label: 'Activos Registrados',
      value: String(assetCount),
      href: '/assets',
      icon: Server,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
    },
    {
      label: 'Riesgos Criticos + Altos',
      value: String(criticalRisks + highRisks),
      href: '/risks',
      icon: ShieldAlert,
      color: criticalRisks > 0 ? 'text-rose-400' : 'text-amber-400',
      bg: criticalRisks > 0 ? 'bg-rose-400/10' : 'bg-amber-400/10',
      border: criticalRisks > 0 ? 'border-rose-400/20' : 'border-amber-400/20',
    },
    {
      label: 'Vulnerabilidades Abiertas',
      value: String(openVulns),
      href: '/vulnerabilities',
      icon: Bug,
      color: openVulns > 10 ? 'text-rose-400' : openVulns > 0 ? 'text-amber-400' : 'text-emerald-400',
      bg: openVulns > 10 ? 'bg-rose-400/10' : openVulns > 0 ? 'bg-amber-400/10' : 'bg-emerald-400/10',
      border: openVulns > 10 ? 'border-rose-400/20' : openVulns > 0 ? 'border-amber-400/20' : 'border-emerald-400/20',
    },
    {
      label: 'Incidentes Activos',
      value: String(activeIncidents),
      href: '/incidents',
      icon: AlertTriangle,
      color: activeIncidents > 0 ? 'text-orange-400' : 'text-emerald-400',
      bg: activeIncidents > 0 ? 'bg-orange-400/10' : 'bg-emerald-400/10',
      border: activeIncidents > 0 ? 'border-orange-400/20' : 'border-emerald-400/20',
    },
    {
      label: 'Controles Implementados',
      value: controlsRatio,
      href: '/controls',
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      label: 'No Conformidades Abiertas',
      value: String(openNCs),
      href: '/nonconformities',
      icon: FileText,
      color: openNCs > 0 ? 'text-amber-400' : 'text-emerald-400',
      bg: openNCs > 0 ? 'bg-amber-400/10' : 'bg-emerald-400/10',
      border: openNCs > 0 ? 'border-amber-400/20' : 'border-emerald-400/20',
    },
    {
      label: 'Usuarios en Org',
      value: String(memberCount),
      href: '/settings/users',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
    },
  ];

  const riskDistribution = [
    { level: 'Critico', count: criticalRisks, color: 'bg-rose-500', textColor: 'text-rose-400' },
    { level: 'Alto', count: highRisks, color: 'bg-orange-500', textColor: 'text-orange-400' },
    { level: 'Medio', count: totalRisks - criticalRisks - highRisks, color: 'bg-amber-500', textColor: 'text-amber-400' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Centro de Comando</h1>
        <p className="mt-1 text-sm text-slate-400">
          Vision unificada del estado de ciberseguridad y cumplimiento normativo
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`rounded-xl border ${kpi.border} ${kpi.bg} p-4 sm:p-5 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">{kpi.label}</p>
                  <p className={`mt-2 text-2xl sm:text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
                <div className={`rounded-lg ${kpi.bg} p-3`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Compliance by Framework */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-200">Cumplimiento por Framework</h2>
            <Link href="/compliance" className="text-xs text-cyan-400 hover:text-cyan-300">Ver detalle</Link>
          </div>
          {frameworks.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No hay frameworks configurados</p>
          ) : (
            <div className="space-y-4">
              {frameworks.slice(0, 6).map((fw) => {
                const pct = fw.compliance_percentage;
                const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-cyan-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                return (
                  <div key={fw.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">{fw.name}</span>
                      <span className="text-sm font-medium text-slate-300">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-200">Distribucion de Riesgos</h2>
            <Link href="/risks" className="text-xs text-cyan-400 hover:text-cyan-300">Ver todos</Link>
          </div>
          {totalRisks === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No hay riesgos evaluados</p>
          ) : (
            <div className="space-y-3">
              {riskDistribution.map((risk) => (
                <div key={risk.level} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                  <span className="text-sm text-slate-400 w-20">{risk.level}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${risk.color} transition-all`}
                      style={{ width: totalRisks > 0 ? `${Math.round((risk.count / totalRisks) * 100)}%` : '0%' }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${risk.textColor} w-8 text-right`}>
                    {risk.count}
                  </span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total escenarios de riesgo</span>
                  <span className="font-medium text-slate-300">{totalRisks}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
