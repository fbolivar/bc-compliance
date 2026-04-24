import { requireOrg } from '@/shared/lib/get-org';
import {
  getThreatById,
  getLinkedRisksForThreat,
  getLinkedControlsForThreat,
} from '@/features/threats/services/threatService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  Shield,
  ShieldAlert,
  Lock,
  Globe,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORIGIN_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  natural: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Natural',
  },
  industrial: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Industrial',
  },
  accidental: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Accidental',
  },
  deliberate: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Deliberada',
  },
};

const DIMENSION_STYLES: Record<string, { short: string; color: string; label: string }> = {
  confidentiality: { short: 'C', color: 'bg-blue-100 text-blue-700', label: 'Confidencialidad' },
  integrity: { short: 'I', color: 'bg-emerald-100 text-emerald-700', label: 'Integridad' },
  availability: { short: 'A', color: 'bg-amber-100 text-amber-700', label: 'Disponibilidad' },
  authenticity: { short: 'Au', color: 'bg-purple-100 text-purple-700', label: 'Autenticidad' },
  traceability: { short: 'T', color: 'bg-slate-100 text-slate-600', label: 'Trazabilidad' },
};

const RISK_ZONE_STYLES: Record<string, string> = {
  Extremo: 'bg-rose-50 text-rose-700 border border-rose-200',
  Alto: 'bg-amber-50 text-amber-700 border border-amber-200',
  Moderado: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  Bajo: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const TREATMENT_LABEL: Record<string, string> = {
  mitigate: 'Mitigar',
  transfer: 'Transferir',
  accept: 'Aceptar',
  avoid: 'Evitar',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function OriginBadge({ origin }: { origin: string }) {
  const style = ORIGIN_STYLES[origin];
  if (!style) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
        {origin}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${style.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {style.label}
    </span>
  );
}

function RiskZoneBadge({ zone }: { zone: string | null }) {
  if (!zone) return <span className="text-xs text-slate-400">-</span>;
  const cls = RISK_ZONE_STYLES[zone] ?? 'bg-slate-50 text-slate-600 border border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {zone}
    </span>
  );
}

function EffectivenessBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-400">-</span>;
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ThreatDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();

  const [threat, linkedRisks, linkedControls] = await Promise.all([
    getThreatById(id),
    getLinkedRisksForThreat(id),
    getLinkedControlsForThreat(id),
  ]);

  if (!threat) notFound();

  const originStyle = ORIGIN_STYLES[threat.origin];

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="space-y-1">
        <Link
          href="/threats"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al catálogo
        </Link>
        <PageHeader
          title={threat.name}
          description={`Código: ${threat.code}`}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <OriginBadge origin={threat.origin} />
              {threat.affected_dimensions.map((dim) => {
                const d = DIMENSION_STYLES[dim];
                if (!d) return null;
                return (
                  <span
                    key={dim}
                    title={d.label}
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold ${d.color}`}
                  >
                    {d.short}
                  </span>
                );
              })}
            </div>
          }
        />
      </div>

      {/* Info card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Información de la amenaza</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Código</dt>
              <dd className="font-mono text-xs font-medium text-slate-700">{threat.code}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Origen</dt>
              <dd><OriginBadge origin={threat.origin} /></dd>
            </div>
            {threat.category && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Categoría</dt>
                <dd className="text-slate-700 text-right">{threat.category}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Tipo</dt>
              <dd>
                {threat.is_system ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Lock className="w-3 h-3" />
                    Sistema (MAGERIT)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-sky-600">
                    <Globe className="w-3 h-3" />
                    Personalizada
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Dimensiones afectadas</dt>
              <dd className="flex flex-wrap gap-1 justify-end">
                {threat.affected_dimensions.length === 0 ? (
                  <span className="text-slate-400">Ninguna</span>
                ) : (
                  threat.affected_dimensions.map((dim) => {
                    const d = DIMENSION_STYLES[dim];
                    if (!d) return null;
                    return (
                      <span
                        key={dim}
                        title={d.label}
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold ${d.color}`}
                      >
                        {d.short}
                      </span>
                    );
                  })
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Description card */}
        {threat.description && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Descripción</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{threat.description}</p>
          </div>
        )}
      </div>

      {/* Linked Risks */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Riesgos vinculados</h2>
          </div>
          <span className="text-xs text-slate-400 tabular-nums">{linkedRisks.length} riesgo{linkedRisks.length !== 1 ? 's' : ''}</span>
        </div>

        {linkedRisks.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No hay riesgos vinculados a esta amenaza.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Zona</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32 hidden md:table-cell">Tratamiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linkedRisks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/risks/${risk.id}`}
                        className="font-mono text-xs font-medium text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        {risk.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/risks/${risk.id}`}
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        {risk.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <RiskZoneBadge zone={risk.risk_zone} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-600">
                        {risk.treatment ? (TREATMENT_LABEL[risk.treatment] ?? risk.treatment) : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Linked Controls */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Controles asociados</h2>
          </div>
          <span className="text-xs text-slate-400 tabular-nums">{linkedControls.length} control{linkedControls.length !== 1 ? 'es' : ''}</span>
        </div>

        {linkedControls.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No hay controles asociados a los riesgos de esta amenaza.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32 hidden md:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-36 hidden lg:table-cell">Efectividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linkedControls.map((control) => (
                  <tr key={control.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/controls/${control.id}`}
                        className="font-mono text-xs font-medium text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        {control.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/controls/${control.id}`}
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        {control.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-600 capitalize">{control.control_type?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={control.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <EffectivenessBar value={control.overall_effectiveness} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
