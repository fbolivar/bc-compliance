import React from 'react';
import { requireOrg } from '@/shared/lib/get-org';
import { countRecords } from '@/shared/lib/service-helpers';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { createClient } from '@/lib/supabase/server';
import { Shield, ShieldAlert, Server, Bug, AlertTriangle, CheckSquare, FileText, Users, ClipboardCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ComplianceRing } from './compliance-ring';

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
      accent: avgCompliance >= 70 ? 'from-emerald-500/40' : avgCompliance >= 50 ? 'from-amber-500/40' : 'from-rose-500/40',
    },
    {
      label: 'Activos Registrados',
      value: String(assetCount),
      href: '/assets',
      icon: Server,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
      accent: 'from-cyan-500/40',
    },
    {
      label: 'Riesgos Criticos + Altos',
      value: String(criticalRisks + highRisks),
      href: '/risks',
      icon: ShieldAlert,
      color: criticalRisks > 0 ? 'text-rose-400' : 'text-amber-400',
      bg: criticalRisks > 0 ? 'bg-rose-400/10' : 'bg-amber-400/10',
      border: criticalRisks > 0 ? 'border-rose-400/20' : 'border-amber-400/20',
      accent: criticalRisks > 0 ? 'from-rose-500/40' : 'from-amber-500/40',
    },
    {
      label: 'Vulnerabilidades Abiertas',
      value: String(openVulns),
      href: '/vulnerabilities',
      icon: Bug,
      color: openVulns > 10 ? 'text-rose-400' : openVulns > 0 ? 'text-amber-400' : 'text-emerald-400',
      bg: openVulns > 10 ? 'bg-rose-400/10' : openVulns > 0 ? 'bg-amber-400/10' : 'bg-emerald-400/10',
      border: openVulns > 10 ? 'border-rose-400/20' : openVulns > 0 ? 'border-amber-400/20' : 'border-emerald-400/20',
      accent: openVulns > 10 ? 'from-rose-500/40' : openVulns > 0 ? 'from-amber-500/40' : 'from-emerald-500/40',
    },
    {
      label: 'Incidentes Activos',
      value: String(activeIncidents),
      href: '/incidents',
      icon: AlertTriangle,
      color: activeIncidents > 0 ? 'text-orange-400' : 'text-emerald-400',
      bg: activeIncidents > 0 ? 'bg-orange-400/10' : 'bg-emerald-400/10',
      border: activeIncidents > 0 ? 'border-orange-400/20' : 'border-emerald-400/20',
      accent: activeIncidents > 0 ? 'from-orange-500/40' : 'from-emerald-500/40',
    },
    {
      label: 'Controles Implementados',
      value: controlsRatio,
      href: '/controls',
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      accent: 'from-blue-500/40',
    },
    {
      label: 'No Conformidades Abiertas',
      value: String(openNCs),
      href: '/nonconformities',
      icon: FileText,
      color: openNCs > 0 ? 'text-amber-400' : 'text-emerald-400',
      bg: openNCs > 0 ? 'bg-amber-400/10' : 'bg-emerald-400/10',
      border: openNCs > 0 ? 'border-amber-400/20' : 'border-emerald-400/20',
      accent: openNCs > 0 ? 'from-amber-500/40' : 'from-emerald-500/40',
    },
    {
      label: 'Usuarios en Org',
      value: String(memberCount),
      href: '/settings/users',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
      accent: 'from-purple-500/40',
    },
  ];

  const riskDistribution = [
    { level: 'Critico', count: criticalRisks, color: 'bg-rose-500', textColor: 'text-rose-400', dotColor: 'bg-rose-500' },
    { level: 'Alto', count: highRisks, color: 'bg-orange-500', textColor: 'text-orange-400', dotColor: 'bg-orange-500' },
    { level: 'Medio', count: totalRisks - criticalRisks - highRisks, color: 'bg-amber-500', textColor: 'text-amber-400', dotColor: 'bg-amber-500' },
  ];

  // --- New design computed values ---
  const globalCompliance = avgCompliance;

  // Tailwind classes derived from compliance threshold (no inline style needed)
  const complianceBorderClass =
    globalCompliance >= 80
      ? 'border-l-emerald-500'
      : globalCompliance >= 60
      ? 'border-l-cyan-500'
      : globalCompliance >= 40
      ? 'border-l-amber-500'
      : 'border-l-rose-500';

  const complianceTextClass =
    globalCompliance >= 80
      ? 'text-emerald-400'
      : globalCompliance >= 60
      ? 'text-cyan-400'
      : globalCompliance >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  // Hex color only used for conic-gradient (CSS custom property, unavoidable dynamic value)
  const complianceHex =
    globalCompliance >= 80
      ? '#10b981'
      : globalCompliance >= 60
      ? '#06b6d4'
      : globalCompliance >= 40
      ? '#f59e0b'
      : '#f43f5e';

  const showAlertBanner = criticalRisks > 0 || activeIncidents > 0;

  const quickActions = [
    { label: 'Registrar Activo', href: '/assets', icon: Server },
    { label: 'Reportar Incidente', href: '/incidents', icon: AlertTriangle },
    { label: 'Crear Control', href: '/controls', icon: Shield },
    { label: 'Nueva Auditoria', href: '/audits', icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Row 1: Alert Banner */}
      {showAlertBanner && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-rose-300 truncate">
              {criticalRisks > 0 && activeIncidents > 0
                ? `${criticalRisks} riesgo${criticalRisks !== 1 ? 's' : ''} critico${criticalRisks !== 1 ? 's' : ''} y ${activeIncidents} incidente${activeIncidents !== 1 ? 's' : ''} activo${activeIncidents !== 1 ? 's' : ''} requieren atencion inmediata`
                : criticalRisks > 0
                ? `${criticalRisks} riesgo${criticalRisks !== 1 ? 's' : ''} critico${criticalRisks !== 1 ? 's' : ''} requiere${criticalRisks !== 1 ? 'n' : ''} atencion inmediata`
                : `${activeIncidents} incidente${activeIncidents !== 1 ? 's' : ''} activo${activeIncidents !== 1 ? 's' : ''} requiere${activeIncidents !== 1 ? 'n' : ''} atencion`}
            </p>
          </div>
          <Link
            href={criticalRisks > 0 ? '/risks' : '/incidents'}
            className="flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors shrink-0"
          >
            Ver {criticalRisks > 0 ? 'riesgos' : 'incidentes'}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Estado de seguridad y cumplimiento — ISO 27001:2022
        </p>
      </div>

      {/* Row 2: Primary KPIs */}
      <section aria-label="Indicadores primarios">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Cumplimiento Global with circular progress */}
          <Link
            href="/compliance"
            className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80 group border-l-4 ${complianceBorderClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cumplimiento Global</p>
                <p className={`mt-2 text-4xl sm:text-5xl font-bold tracking-tight ${complianceTextClass}`}>
                  {globalCompliance}%
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {frameworks.length} framework{frameworks.length !== 1 ? 's' : ''} activo{frameworks.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ComplianceRing value={globalCompliance} color={complianceHex} />
            </div>
          </Link>

          {/* Card 2: Riesgos Criticos + Altos */}
          <Link
            href="/risks"
            className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80 group border-l-4 ${criticalRisks > 0 ? 'border-l-rose-500' : 'border-l-amber-500'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Riesgos Criticos + Altos</p>
                <p className={`mt-2 text-4xl sm:text-5xl font-bold tracking-tight ${criticalRisks > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {criticalRisks + highRisks}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {criticalRisks} criticos · {highRisks} altos
                </p>
              </div>
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${criticalRisks > 0 ? 'bg-rose-500/15' : 'bg-amber-500/15'}`} aria-hidden="true">
                <ShieldAlert className={`h-5 w-5 ${criticalRisks > 0 ? 'text-rose-400' : 'text-amber-400'}`} />
              </div>
            </div>
          </Link>

          {/* Card 3: Vulnerabilidades Abiertas */}
          <Link
            href="/vulnerabilities"
            className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80 group border-l-4 ${openVulns > 10 ? 'border-l-rose-500' : openVulns > 0 ? 'border-l-amber-500' : 'border-l-emerald-500'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vulnerabilidades Abiertas</p>
                <p className={`mt-2 text-4xl sm:text-5xl font-bold tracking-tight ${openVulns > 10 ? 'text-rose-400' : openVulns > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {openVulns}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {openVulns === 0 ? 'Sin vulnerabilidades abiertas' : openVulns > 10 ? 'Requieren atencion urgente' : 'En revision'}
                </p>
              </div>
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${openVulns > 10 ? 'bg-rose-500/15' : openVulns > 0 ? 'bg-amber-500/15' : 'bg-emerald-500/15'}`} aria-hidden="true">
                <Bug className={`h-5 w-5 ${openVulns > 10 ? 'text-rose-400' : openVulns > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
              </div>
            </div>
          </Link>

          {/* Card 4: Incidentes Activos */}
          <Link
            href="/incidents"
            className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80 group border-l-4 ${activeIncidents > 0 ? 'border-l-orange-500' : 'border-l-emerald-500'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incidentes Activos</p>
                <p className={`mt-2 text-4xl sm:text-5xl font-bold tracking-tight ${activeIncidents > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {activeIncidents}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {activeIncidents === 0 ? 'Sin incidentes detectados' : `Estado: detectado`}
                </p>
              </div>
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${activeIncidents > 0 ? 'bg-orange-500/15' : 'bg-emerald-500/15'}`} aria-hidden="true">
                <AlertTriangle className={`h-5 w-5 ${activeIncidents > 0 ? 'text-orange-400' : 'text-emerald-400'}`} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Row 3: Secondary KPIs */}
      <section aria-label="Indicadores secundarios">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          <Link
            href="/assets"
            className="rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/70 hover:border-slate-700 transition-all group"
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">Activos Registrados</p>
              <p className="mt-0.5 text-2xl font-bold text-cyan-400 tabular-nums">{assetCount}</p>
            </div>
            <Server className="h-5 w-5 text-slate-600 group-hover:text-slate-500 transition-colors shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/controls"
            className="rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/70 hover:border-slate-700 transition-all group"
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">Controles Implementados</p>
              <p className="mt-0.5 text-2xl font-bold text-blue-400 tabular-nums font-mono">{controlsRatio}</p>
            </div>
            <Shield className="h-5 w-5 text-slate-600 group-hover:text-slate-500 transition-colors shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/nonconformities"
            className="rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/70 hover:border-slate-700 transition-all group"
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">No Conformidades</p>
              <p className={`mt-0.5 text-2xl font-bold tabular-nums ${openNCs > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{openNCs}</p>
            </div>
            <FileText className="h-5 w-5 text-slate-600 group-hover:text-slate-500 transition-colors shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/settings/users"
            className="rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/70 hover:border-slate-700 transition-all group"
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">Usuarios en Org</p>
              <p className="mt-0.5 text-2xl font-bold text-purple-400 tabular-nums">{memberCount}</p>
            </div>
            <Users className="h-5 w-5 text-slate-600 group-hover:text-slate-500 transition-colors shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Row 4: Two-column analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

        {/* Left 60%: Cumplimiento por Framework */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Cumplimiento por Framework</h2>
              <p className="mt-0.5 text-xs text-slate-500">Controles implementados por estandar</p>
            </div>
            <Link
              href="/compliance"
              className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver detalle
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {frameworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckSquare className="h-8 w-8 text-slate-700" aria-hidden="true" />
              <p className="text-sm text-slate-500">No hay frameworks configurados</p>
              <Link href="/compliance" className="mt-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Agregar framework
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {frameworks.slice(0, 6).map((fw) => {
                const pct = fw.compliance_percentage;
                const barColor =
                  pct >= 80
                    ? 'bg-emerald-500'
                    : pct >= 60
                    ? 'bg-cyan-500'
                    : pct >= 40
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
                const textColor =
                  pct >= 80
                    ? 'text-emerald-400'
                    : pct >= 60
                    ? 'text-cyan-400'
                    : pct >= 40
                    ? 'text-amber-400'
                    : 'text-rose-400';
                return (
                  <div key={fw.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-300 truncate pr-4">{fw.name}</span>
                      <span className={`text-sm font-bold font-mono tabular-nums shrink-0 ${textColor}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <progress
                        value={pct}
                        max={100}
                        aria-label={`${fw.name}: ${pct}%`}
                        className={[
                          'block h-full w-full appearance-none bg-transparent',
                          '[&::-webkit-progress-bar]:bg-transparent',
                          `[&::-webkit-progress-value]:${barColor} [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-700`,
                          `[&::-moz-progress-bar]:${barColor} [&::-moz-progress-bar]:rounded-full`,
                        ].join(' ')}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 40%: Distribucion de Riesgos */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Estado de Riesgos</h2>
              <p className="mt-0.5 text-xs text-slate-500">Distribucion por severidad</p>
            </div>
            <Link
              href="/risks"
              className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver todos
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {totalRisks === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Shield className="h-8 w-8 text-slate-700" aria-hidden="true" />
              <p className="text-sm text-slate-500">No hay riesgos evaluados</p>
              <Link href="/risks" className="mt-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Registrar riesgo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {riskDistribution.map((risk) => (
                <div key={risk.level}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${risk.dotColor}`} aria-hidden="true" />
                      <span className="text-sm font-medium text-slate-400">{risk.level}</span>
                    </div>
                    <span className={`text-sm font-bold font-mono tabular-nums ${risk.textColor}`}>
                      {risk.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <progress
                      value={risk.count}
                      max={totalRisks > 0 ? totalRisks : 1}
                      aria-label={`${risk.level}: ${risk.count} de ${totalRisks}`}
                      className={[
                        'block h-full w-full appearance-none bg-transparent',
                        '[&::-webkit-progress-bar]:bg-transparent',
                        `[&::-webkit-progress-value]:${risk.color} [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-700`,
                        `[&::-moz-progress-bar]:${risk.color} [&::-moz-progress-bar]:rounded-full`,
                      ].join(' ')}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Total escenarios</span>
                <span className="text-sm font-bold text-slate-200 font-mono tabular-nums">{totalRisks}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Quick Actions */}
      <section aria-label="Acciones rapidas">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/70 hover:text-slate-100 hover:border-slate-600 transition-all"
            >
              <Icon className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
