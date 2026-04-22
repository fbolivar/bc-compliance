import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { countRecords } from '@/shared/lib/service-helpers';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { getIntegrationKPIs } from '@/features/compliance/services/integrationMetricsService';
import { createClient } from '@/lib/supabase/server';
import {
  Shield,
  ShieldAlert,
  Server,
  Bug,
  AlertTriangle,
  CheckSquare,
  FileText,
  Users,
  ClipboardCheck,
  ChevronRight,
  ArrowRight,
  Building2,
  Lock,
  Layers,
  BookOpen,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { ComplianceRing } from './compliance-ring';
import { ProgressBar } from './progress-bar';

// --- Helpers ---

function getGreeting(): string {
  // Server component: use UTC offset approximation for Colombia (UTC-5)
  const now = new Date();
  const hour = (now.getUTCHours() - 5 + 24) % 24;
  if (hour >= 5 && hour < 12) return 'Buenos dias';
  if (hour >= 12 && hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getSpanishDate(): string {
  const now = new Date();
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const dayName = days[now.getUTCDay()];
  const day = now.getUTCDate();
  const month = months[now.getUTCMonth()];
  const year = now.getUTCFullYear();
  return `${dayName}, ${day} de ${month} de ${year}`;
}

export default async function DashboardPage() {
  const { orgId, isPlatformOwner, userName } = await getCurrentOrg();

  if (!orgId) {
    redirect('/login');
  }

  const supabase = await createClient();

  const [
    assetCount,
    totalRisks,
    criticalRisks,
    highRisks,
    mediumRisks,
    lowRisks,
    openVulns,
    activeIncidents,
    implementedControls,
    totalControls,
    openNCs,
    docCount,
    memberCount,
    vendorCount,
    frameworks,
    integrationKPIs,
  ] = await Promise.all([
    countRecords('assets', orgId),
    countRecords('risk_scenarios', orgId),
    countRecords('risk_scenarios', orgId, { risk_level: 'critical' }),
    countRecords('risk_scenarios', orgId, { risk_level: 'high' }),
    countRecords('risk_scenarios', orgId, { risk_level: 'medium' }),
    countRecords('risk_scenarios', orgId, { risk_level: 'low' }),
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
    supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .then(({ count }) => count || 0),
    getFrameworksWithCompliance(orgId),
    getIntegrationKPIs(orgId),
  ]);

  const controlsRatio = totalControls > 0
    ? `${implementedControls}/${totalControls}`
    : '0/0';

  const avgCompliance = frameworks.length > 0
    ? Math.round(frameworks.reduce((sum, fw) => sum + fw.compliance_percentage, 0) / frameworks.length)
    : 0;

  // Hex color only used for conic-gradient (CSS custom property, unavoidable dynamic value)
  const complianceHex =
    avgCompliance >= 80 ? '#10b981'
    : avgCompliance >= 60 ? '#06b6d4'
    : avgCompliance >= 40 ? '#f59e0b'
    : '#f43f5e';

  const greeting = getGreeting();
  const dateString = getSpanishDate();
  const displayName = userName || 'Usuario';

  const riskDistribution = [
    { level: 'Critico', count: criticalRisks, barColor: 'bg-rose-500', textColor: 'text-rose-600', dotColor: 'bg-rose-500' },
    { level: 'Alto', count: highRisks, barColor: 'bg-orange-500', textColor: 'text-orange-600', dotColor: 'bg-orange-500' },
    { level: 'Medio', count: mediumRisks, barColor: 'bg-amber-400', textColor: 'text-amber-600', dotColor: 'bg-amber-400' },
    { level: 'Bajo', count: lowRisks, barColor: 'bg-emerald-500', textColor: 'text-emerald-600', dotColor: 'bg-emerald-500' },
  ];

  const quickLinks = [
    { label: 'Activos', href: '/assets', icon: Server, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Riesgos', href: '/risks', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Controles', href: '/controls', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cumplimiento', href: '/compliance', icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Incidentes', href: '/incidents', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Proveedores', href: '/vendors', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'No Conformidades', href: '/nonconformities', icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Documentos', href: '/documents', icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  return (
    <div className="space-y-6 pb-10">

      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{dateString}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-slate-500">Panel de control — BC Trust</p>
      </div>

      {/* ── 2. Alert Banners ──────────────────────────────────────── */}
      {(criticalRisks > 0 || activeIncidents > 0 || openNCs > 0 || openVulns > 0) && (
        <div className="flex flex-wrap gap-2" role="alert" aria-label="Alertas activas">
          {criticalRisks > 0 && (
            <Link
              href="/risks"
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
              {criticalRisks} riesgo{criticalRisks !== 1 ? 's' : ''} critico{criticalRisks !== 1 ? 's' : ''}
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
            </Link>
          )}
          {activeIncidents > 0 && (
            <Link
              href="/incidents"
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
              {activeIncidents} incidente{activeIncidents !== 1 ? 's' : ''} abierto{activeIncidents !== 1 ? 's' : ''}
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
            </Link>
          )}
          {openNCs > 0 && (
            <Link
              href="/nonconformities"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
              {openNCs} no conformidad{openNCs !== 1 ? 'es' : ''} abierta{openNCs !== 1 ? 's' : ''}
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
            </Link>
          )}
          {openVulns > 0 && (
            <Link
              href="/vulnerabilities"
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
              {openVulns} vulnerabilidad{openVulns !== 1 ? 'es' : ''} abierta{openVulns !== 1 ? 's' : ''}
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {/* ── 3. KPI Row 1 — Primary metrics ───────────────────────── */}
      <section aria-label="Metricas primarias">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Activos */}
          <Link
            href="/assets"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0" aria-hidden="true">
                <Server className="h-5 w-5 text-emerald-600" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{assetCount}</p>
              <p className="text-sm text-slate-500 mt-0.5">Activos</p>
              <p className="text-xs text-slate-400 mt-0.5">Registrados</p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver activos →</span>
          </Link>

          {/* Riesgos */}
          <Link
            href="/risks"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${criticalRisks > 0 ? 'bg-rose-50' : 'bg-amber-50'}`} aria-hidden="true">
                <ShieldAlert className={`h-5 w-5 ${criticalRisks > 0 ? 'text-rose-600' : 'text-amber-600'}`} />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{totalRisks}</p>
              <p className="text-sm text-slate-500 mt-0.5">Riesgos</p>
              <p className={`text-xs mt-0.5 ${criticalRisks > 0 ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                {criticalRisks > 0 ? `${criticalRisks} critico${criticalRisks !== 1 ? 's' : ''}` : 'Sin criticos'}
              </p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver riesgos →</span>
          </Link>

          {/* Incidentes */}
          <Link
            href="/incidents"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative ${activeIncidents > 0 ? 'bg-orange-50' : 'bg-slate-50'}`} aria-hidden="true">
                <AlertTriangle className={`h-5 w-5 ${activeIncidents > 0 ? 'text-orange-600' : 'text-slate-400'}`} />
                {activeIncidents > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{activeIncidents}</p>
              <p className="text-sm text-slate-500 mt-0.5">Incidentes</p>
              <p className={`text-xs mt-0.5 ${activeIncidents > 0 ? 'text-orange-500 font-medium' : 'text-slate-400'}`}>
                {activeIncidents > 0 ? `${activeIncidents} abierto${activeIncidents !== 1 ? 's' : ''}` : 'Sin incidentes'}
              </p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver incidentes →</span>
          </Link>

          {/* No Conformidades */}
          <Link
            href="/nonconformities"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${openNCs > 0 ? 'bg-amber-50' : 'bg-blue-50'}`} aria-hidden="true">
                <ClipboardCheck className={`h-5 w-5 ${openNCs > 0 ? 'text-amber-600' : 'text-blue-600'}`} />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{openNCs}</p>
              <p className="text-sm text-slate-500 mt-0.5">No Conformidades</p>
              <p className={`text-xs mt-0.5 ${openNCs > 0 ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
                {openNCs > 0 ? `${openNCs} abierta${openNCs !== 1 ? 's' : ''}` : 'Sin abiertas'}
              </p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver no conformidades →</span>
          </Link>
        </div>
      </section>

      {/* ── 4. KPI Row 2 — Secondary metrics ─────────────────────── */}
      <section aria-label="Metricas secundarias">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Vulnerabilidades */}
          <Link
            href="/vulnerabilities"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${openVulns > 0 ? 'bg-rose-50' : 'bg-slate-50'}`} aria-hidden="true">
                <Bug className={`h-5 w-5 ${openVulns > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{openVulns}</p>
              <p className="text-sm text-slate-500 mt-0.5">Vulnerabilidades</p>
              <p className="text-xs text-slate-400 mt-0.5">Abiertas</p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver vulnerabilidades →</span>
          </Link>

          {/* Controles */}
          <Link
            href="/controls"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0" aria-hidden="true">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums font-mono">{controlsRatio}</p>
              <p className="text-sm text-slate-500 mt-0.5">Controles</p>
              <p className="text-xs text-slate-400 mt-0.5">Implementados</p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver controles →</span>
          </Link>

          {/* Documentos */}
          <Link
            href="/documents"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0" aria-hidden="true">
                <BookOpen className="h-5 w-5 text-teal-600" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{docCount}</p>
              <p className="text-sm text-slate-500 mt-0.5">Documentos</p>
              <p className="text-xs text-slate-400 mt-0.5">En biblioteca</p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver biblioteca →</span>
          </Link>

          {/* Usuarios */}
          <Link
            href="/settings/users"
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0" aria-hidden="true">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{memberCount}</p>
              <p className="text-sm text-slate-500 mt-0.5">Usuarios</p>
              <p className="text-xs text-slate-400 mt-0.5">En organizacion</p>
            </div>
            <span className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto">Ver usuarios →</span>
          </Link>
        </div>
      </section>

      {/* ── 5. Postura de Seguridad — Frameworks ─────────────────── */}
      <section aria-label="Postura de seguridad por framework">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Postura de Seguridad
        </p>
        {frameworks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 flex flex-col items-center justify-center gap-2">
            <Lock className="h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm text-slate-500">No hay frameworks configurados</p>
            <Link href="/compliance" className="text-xs text-sky-500 hover:text-sky-600 transition-colors">
              Agregar framework →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {frameworks.map((fw) => {
              const pct = fw.compliance_percentage;
              const barColor =
                pct >= 80 ? 'bg-emerald-500'
                : pct >= 60 ? 'bg-sky-500'
                : pct >= 40 ? 'bg-amber-500'
                : 'bg-rose-500';
              const textColor =
                pct >= 80 ? 'text-emerald-600'
                : pct >= 60 ? 'text-sky-600'
                : pct >= 40 ? 'text-amber-500'
                : 'text-rose-500';
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fwAny = fw as any;
              const implemented = fwAny.implemented_controls ?? 0;
              const total = fwAny.total_controls ?? 0;
              const partial = fwAny.partial_controls ?? 0;
              const notImpl = Math.max(0, total - implemented - partial);

              return (
                <Link
                  key={fw.id}
                  href="/compliance"
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0" aria-hidden="true">
                      <Layers className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className={`text-2xl font-bold tabular-nums ${textColor}`}>{pct}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 truncate">{fw.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{total} controles</p>
                  </div>
                  <div>
                    <ProgressBar
                      value={pct}
                      max={100}
                      label={`${fw.name}: ${pct}% cumplimiento`}
                      colorClass={barColor}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      {implemented > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                          {implemented}
                        </span>
                      )}
                      {partial > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                          {partial}
                        </span>
                      )}
                      {notImpl > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" aria-hidden="true" />
                          {notImpl}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-sky-500 group-hover:text-sky-600 font-medium">
                    Ver modulo →
                  </span>
                </Link>
              );
            })}
            {/* Global Compliance summary card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0" aria-hidden="true">
                  <CheckSquare className="h-4 w-4 text-slate-500" />
                </div>
                <ComplianceRing value={avgCompliance} color={complianceHex} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Cumplimiento Global</p>
                <p className="text-xs text-slate-400 mt-0.5">{frameworks.length} framework{frameworks.length !== 1 ? 's' : ''} activo{frameworks.length !== 1 ? 's' : ''}</p>
              </div>
              <Link
                href="/compliance"
                className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto"
              >
                Ver detalle →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── 6. Bottom Analytics Row ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Riesgos por nivel */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Riesgos por Nivel</p>
              <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{totalRisks}</p>
              <p className="text-xs text-slate-400">Escenarios totales</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0" aria-hidden="true">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
          </div>
          {totalRisks === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin riesgos registrados</p>
          ) : (
            <div className="space-y-2.5" role="list" aria-label="Distribucion de riesgos">
              {riskDistribution.map((risk) => (
                <div key={risk.level} role="listitem">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${risk.dotColor}`} aria-hidden="true" />
                      <span className="text-xs font-medium text-slate-600">{risk.level}</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${risk.textColor}`}>{risk.count}</span>
                  </div>
                  <ProgressBar
                    value={risk.count}
                    max={totalRisks}
                    label={`${risk.level}: ${risk.count}`}
                    colorClass={risk.barColor}
                  />
                </div>
              ))}
            </div>
          )}
          <Link
            href="/risks"
            className="text-xs text-sky-500 hover:text-sky-600 font-medium mt-auto"
          >
            Gestionar riesgos →
          </Link>
        </div>

        {/* No Conformidades */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Conformidades</p>
              <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{openNCs}</p>
              <p className="text-xs text-slate-400">Abiertas actualmente</p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${openNCs > 0 ? 'bg-amber-50' : 'bg-slate-50'}`} aria-hidden="true">
              <ClipboardCheck className={`h-4 w-4 ${openNCs > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {openNCs === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-4">
                <span className="text-2xl" aria-hidden="true">✓</span>
                <p className="text-sm font-medium text-emerald-600">Sin no conformidades abiertas</p>
                <p className="text-xs text-slate-400">Excelente estado de cumplimiento</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-xs font-medium text-amber-700">Abiertas</span>
                  <span className="text-sm font-bold text-amber-700 tabular-nums">{openNCs}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-600">Total registradas</span>
                  <span className="text-sm font-bold text-slate-700 tabular-nums">{openNCs}</span>
                </div>
              </div>
            )}
          </div>
          <Link
            href="/nonconformities"
            className="text-xs text-sky-500 hover:text-sky-600 font-medium"
          >
            Ver no conformidades →
          </Link>
        </div>

        {/* Proveedores */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proveedores</p>
              <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{vendorCount}</p>
              <p className="text-xs text-slate-400">Registrados en sistema</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0" aria-hidden="true">
              <Building2 className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {vendorCount === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-4">
                <Building2 className="h-8 w-8 text-slate-200" aria-hidden="true" />
                <p className="text-sm text-slate-400 text-center">Sin proveedores registrados</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-xs font-medium text-purple-700">Proveedores activos en gestion</p>
                <p className="text-2xl font-bold text-purple-700 mt-1 tabular-nums">{vendorCount}</p>
              </div>
            )}
          </div>
          <Link
            href="/vendors"
            className="text-xs text-sky-500 hover:text-sky-600 font-medium"
          >
            Ver proveedores →
          </Link>
        </div>
      </div>

      {/* ── 6b. Integración GRC — salud del grafo ─────────────────── */}
      <section aria-label="Integración GRC">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Integración GRC
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Link2 className="w-3 h-3" /> Conectividad del grafo riesgo-control-requisito
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <IntegrationKPI
            label="Riesgos con controles"
            current={integrationKPIs.risksWithControls}
            total={integrationKPIs.totalRisks}
            good
            href="/risks"
          />
          <IntegrationKPI
            label="Riesgos con plan"
            current={integrationKPIs.risksWithTreatmentPlan}
            total={integrationKPIs.totalRisks}
            good
            href="/risks/treatment-plans"
          />
          <IntegrationKPI
            label="Controles en framework"
            current={integrationKPIs.controlsWithRequirement}
            total={integrationKPIs.totalControls}
            good
            href="/controls/mapping"
          />
          <IntegrationKPI
            label="Vulns asociadas a riesgo"
            current={integrationKPIs.vulnerabilitiesLinkedToRisks}
            total={integrationKPIs.totalVulnerabilities}
            good
            href="/vulnerabilities"
          />
          <IntegrationKPI
            label="Incidentes con riesgo"
            current={integrationKPIs.incidentsLinkedToRisks}
            total={integrationKPIs.totalIncidents}
            good
            href="/incidents"
          />
        </div>

        {/* Gaps lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GapList
            title="Riesgos sin controles mitigantes"
            description="Priorizados por nivel residual. Vincula controles desde el detalle del riesgo."
            items={integrationKPIs.topRisksWithoutControls.map((r) => ({
              id: r.id,
              code: r.code,
              label: r.name,
              meta: r.risk_level_residual,
              href: `/risks/${r.id}`,
            }))}
            emptyMessage="✓ Todos los riesgos tienen al menos un control mitigante."
            accentColor="rose"
          />
          <GapList
            title="Controles sin requisito asignado"
            description="Controles sueltos que no cubren ningún framework normativo."
            items={integrationKPIs.topControlsWithoutRequirement.map((c) => ({
              id: c.id,
              code: c.code,
              label: c.name,
              meta: c.status,
              href: `/controls/${c.id}`,
            }))}
            emptyMessage="✓ Todos los controles están mapeados a al menos un requisito."
            accentColor="amber"
          />
        </div>

        {/* Cross-framework summary */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mapeos cross-framework
            </p>
            <p className="text-2xl font-bold text-slate-800 tabular-nums mt-0.5">
              {integrationKPIs.crossFrameworkMappings}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Equivalencias entre requisitos de distintos marcos normativos.
            </p>
          </div>
          <Link
            href="/compliance/cross-framework"
            className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            Gestionar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── 7. Accesos Rapidos ────────────────────────────────────── */}
      <section aria-label="Accesos rapidos">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Accesos Rapidos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(({ label, href, icon: Icon, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`} aria-hidden="true">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <span className="text-sm font-medium text-slate-700 flex-1 truncate">{label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 shrink-0 transition-colors" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

// ─── Integration helpers ─────────────────────────────────────────────────────

function IntegrationKPI({
  label,
  current,
  total,
  href,
}: {
  label: string;
  current: number;
  total: number;
  good?: boolean;
  href: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const color =
    total === 0
      ? 'text-slate-400'
      : pct >= 80
        ? 'text-emerald-600'
        : pct >= 50
          ? 'text-amber-500'
          : 'text-rose-500';
  const bar =
    total === 0
      ? 'bg-slate-200'
      : pct >= 80
        ? 'bg-emerald-500'
        : pct >= 50
          ? 'bg-amber-500'
          : 'bg-rose-400';

  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-1.5"
    >
      <p className="text-[11px] text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-slate-800 tabular-nums">{current}</span>
        <span className="text-xs text-slate-400 tabular-nums">/ {total}</span>
        <span className={`ml-auto text-xs font-bold tabular-nums ${color}`}>{pct}%</span>
      </div>
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

function GapList({
  title,
  description,
  items,
  emptyMessage,
  accentColor,
}: {
  title: string;
  description: string;
  items: Array<{ id: string; code: string; label: string; meta: string; href: string }>;
  emptyMessage: string;
  accentColor: 'rose' | 'amber';
}) {
  const dotColor = accentColor === 'rose' ? 'bg-rose-400' : 'bg-amber-400';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true" />
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</p>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-emerald-600 py-3">{emptyMessage}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
              >
                <span className="font-mono text-xs text-sky-600 w-20 flex-shrink-0">{item.code}</span>
                <span className="text-sm text-slate-700 truncate flex-1">{item.label}</span>
                <span className="text-[11px] text-slate-400 capitalize">{item.meta.replace(/_/g, ' ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
