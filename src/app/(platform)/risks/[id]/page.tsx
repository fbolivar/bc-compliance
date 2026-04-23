import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getRiskById,
  getMitigatingControlsForRisk,
  getAvailableControlsForRisk,
} from '@/features/risks/services/riskService';
import {
  getVulnerabilitiesForRisk,
  getAvailableVulnerabilitiesForRisk,
  getTreatmentPlansForRisk,
  getAvailableTreatmentPlansForRisk,
} from '@/features/compliance/services/relationshipService';
import { requireOrg } from '@/shared/lib/get-org';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { MitigatingControlsPanel } from '@/features/risks/components/MitigatingControlsPanel';
import { RiskVulnerabilitiesPanel } from '@/features/risks/components/RiskVulnerabilitiesPanel';
import { RiskTreatmentPlansPanel } from '@/features/risks/components/RiskTreatmentPlansPanel';
import { DafpControlsPanel } from '@/features/risks/components/DafpControlsPanel';
import { DafpRiskMatrix } from '@/features/risks/components/DafpRiskMatrix';
import { ArrowLeft, Target, AlertTriangle, Activity, Pencil } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

const TREATMENT_LABEL: Record<string, string> = {
  mitigate: 'Reducir / Mitigar',
  transfer: 'Transferir',
  accept: 'Aceptar',
  avoid: 'Evitar',
  share: 'Compartir',
};

const TREATMENT_COLOR: Record<string, string> = {
  mitigate: 'bg-sky-50 text-sky-700 border-sky-200',
  transfer: 'bg-amber-50 text-amber-700 border-amber-200',
  accept: 'bg-slate-50 text-slate-700 border-slate-200',
  avoid: 'bg-rose-50 text-rose-700 border-rose-200',
  share: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const ZONE_HERO_BG: Record<string, string> = {
  Bajo: 'bg-emerald-50 border-emerald-200',
  Moderado: 'bg-amber-50 border-amber-200',
  Alto: 'bg-orange-50 border-orange-200',
  Extremo: 'bg-rose-50 border-rose-200',
};

const ZONE_HERO_TEXT: Record<string, string> = {
  Bajo: 'text-emerald-700',
  Moderado: 'text-amber-700',
  Alto: 'text-orange-700',
  Extremo: 'text-rose-700',
};

function Field({ label, value, full }: { label: string; value: string | number | null | undefined; full?: boolean }) {
  const display =
    value === null || value === undefined || value === ''
      ? '—'
      : String(value);
  return (
    <div className={full ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap break-words">{display}</p>
    </div>
  );
}

function Section({
  number,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/60 flex items-center gap-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 text-sm font-bold border border-sky-200">
          {number}
        </span>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
        {children}
      </div>
    </div>
  );
}

export default async function RiskDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [
    risk,
    mitigatingControls,
    availableControls,
    vulnerabilities,
    availableVulns,
    treatmentPlans,
    availablePlans,
  ] = await Promise.all([
    getRiskById(id),
    getMitigatingControlsForRisk(id),
    getAvailableControlsForRisk(orgId, id),
    getVulnerabilitiesForRisk(id),
    getAvailableVulnerabilitiesForRisk(orgId, id),
    getTreatmentPlansForRisk(id),
    getAvailableTreatmentPlansForRisk(orgId, id),
  ]);
  if (!risk) notFound();

  const zone = risk.risk_zone ?? null;
  const heroBg = zone ? ZONE_HERO_BG[zone] : 'bg-slate-50 border-slate-200';
  const heroText = zone ? ZONE_HERO_TEXT[zone] : 'text-slate-700';
  const treatmentLabel = TREATMENT_LABEL[risk.treatment] ?? risk.treatment;
  const treatmentColor = TREATMENT_COLOR[risk.treatment] ?? 'bg-slate-50 text-slate-700 border-slate-200';

  const hasMagerit = Number(risk.impact_max) > 0 || Number(risk.risk_potential) > 0;

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/risks"
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver a riesgos"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/risks" className="hover:text-slate-700">Riesgos</Link>
          {risk.asset_categories && (
            <>
              <span>/</span>
              <Link href={`/assets/process/${risk.asset_categories.id}`} className="hover:text-slate-700">
                {risk.asset_categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="font-mono font-medium text-slate-700">{risk.code}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className={`rounded-2xl border ${heroBg} p-6 shadow-sm`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wider font-mono ${heroText}`}>
              {risk.code}
            </p>
            <PageHeader
              title={risk.name}
              description={risk.description ?? ''}
            />
          </div>
          <div className="flex flex-col items-end gap-3">
            <Link
              href={`/risks/${risk.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
            {zone && (
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Zona DAFP</p>
                <p className={`text-2xl font-bold ${heroText}`}>{zone}</p>
              </div>
            )}
            <span className={`px-3 py-1 rounded-md text-xs font-medium border ${treatmentColor}`}>
              {treatmentLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Identificación del Riesgo */}
      <Section
        number="1"
        title="Identificación del Riesgo"
        subtitle="Descripción, proceso, activo y amenaza asociada"
        icon={AlertTriangle}
      >
        <Field label="Código" value={risk.code} />
        <Field label="Nombre del Riesgo" value={risk.name} full />
        <Field label="Descripción" value={risk.description} full />
        <Field label="Tipo de Riesgo" value={risk.risk_type} />
        <Field
          label="Proceso"
          value={risk.asset_categories?.name ?? null}
        />
        <Field
          label="Activo"
          value={risk.assets ? `${risk.assets.code} — ${risk.assets.name}` : '(nivel de proceso)'}
        />
        <Field
          label="Amenaza"
          value={risk.threat_catalog ? `${risk.threat_catalog.code} · ${risk.threat_catalog.name}` : null}
          full
        />
        <Field label="Origen de la Amenaza" value={risk.threat_catalog?.origin} />
        <Field label="Causas / Vulnerabilidades" value={risk.causes} full />
        <Field label="Consecuencias" value={risk.consequences} full />
      </Section>

      {/* 2. Análisis del Riesgo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section
            number="2"
            title="Análisis del Riesgo"
            subtitle="Probabilidad × Impacto DAFP 2020"
            icon={Activity}
          >
            <Field
              label="Frecuencia de la actividad"
              value={risk.activity_frequency ? `${risk.activity_frequency} veces/año` : null}
            />
            <Field
              label="Probabilidad Inherente"
              value={risk.probability_label ? `${risk.probability_label} (${((risk.probability_value ?? 0) * 100).toFixed(0)}%)` : null}
            />
            <Field
              label="Impacto Inherente"
              value={risk.impact_label ? `${risk.impact_label} (${((risk.impact_value ?? 0) * 100).toFixed(0)}%)` : null}
            />
            <Field label="Zona de Riesgo Inherente" value={zone} />
            <Field label="Nivel (mapeo interno)" value={risk.risk_level_inherent} />
            <Field label="Tratamiento" value={treatmentLabel} />
            <Field label="Justificación del Tratamiento" value={risk.treatment_justification} full />
          </Section>
        </div>
        <div className="lg:col-span-1">
          <DafpRiskMatrix
            probabilityValue={risk.probability_value}
            impactValue={risk.impact_value}
            zone={zone}
          />
        </div>
      </div>

      {/* 3. Controles DAFP asociados */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/60 flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 text-sm font-bold border border-sky-200">
            3
          </span>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Controles asociados</h3>
              <p className="text-xs text-slate-500">Evaluación DAFP 2020 — 6 atributos por control</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <DafpControlsPanel controls={mitigatingControls} />
          <MitigatingControlsPanel
            riskId={risk.id}
            mitigatingControls={mitigatingControls}
            availableControls={availableControls}
          />
        </div>
      </div>

      {/* 4. Planes de Tratamiento */}
      <RiskTreatmentPlansPanel
        riskId={risk.id}
        items={treatmentPlans}
        availablePlans={availablePlans}
      />

      {/* 5. Vulnerabilidades */}
      <RiskVulnerabilitiesPanel
        riskId={risk.id}
        items={vulnerabilities}
        availableVulns={availableVulns}
      />

      {/* 6. Cálculo MAGERIT (colapsable / informativo) */}
      {hasMagerit && (
        <details className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <summary className="border-b border-slate-100 px-6 py-4 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <span className="text-sm font-semibold text-slate-800">
              Cálculo MAGERIT (cuantitativo)
            </span>
            <span className="text-xs text-slate-500 ml-2">
              · degradación CIA + frecuencia 0-5 + impacto máximo
            </span>
          </summary>
          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-xs text-slate-500">Dimensión</th>
                  <th className="text-right py-2 text-xs text-slate-500">Degradación (%)</th>
                  <th className="text-right py-2 text-xs text-slate-500">Impacto</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Confidencialidad', deg: risk.degradation_c, impact: risk.impact_c },
                  { label: 'Integridad', deg: risk.degradation_i, impact: risk.impact_i },
                  { label: 'Disponibilidad', deg: risk.degradation_a, impact: risk.impact_a },
                  { label: 'Autenticidad', deg: risk.degradation_au, impact: risk.impact_au },
                  { label: 'Trazabilidad', deg: risk.degradation_t, impact: risk.impact_t },
                ].map((d) => (
                  <tr key={d.label} className="border-b border-slate-100">
                    <td className="py-2 text-slate-700">{d.label}</td>
                    <td className="py-2 text-right font-mono text-slate-600">{d.deg ?? 0}%</td>
                    <td className="py-2 text-right font-mono text-slate-600">{Number(d.impact ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td className="py-2 text-sm text-slate-600">Impacto Máximo</td>
                  <td />
                  <td className="py-2 text-right font-mono font-bold text-slate-800">{Number(risk.impact_max).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Frecuencia (0-5)</td>
                  <td />
                  <td className="py-2 text-right font-mono text-slate-700">{risk.frequency}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Riesgo Potencial</td>
                  <td />
                  <td className="py-2 text-right font-mono font-bold text-amber-600">{Number(risk.risk_potential).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Efectividad Salvaguardas</td>
                  <td />
                  <td className="py-2 text-right font-mono text-emerald-600">{risk.safeguard_effectiveness}%</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-2 text-sm font-bold text-slate-800">Riesgo Residual</td>
                  <td />
                  <td className="py-2 text-right font-mono text-xl font-bold text-slate-800">{Number(risk.risk_residual).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
              <span>Nivel inherente:</span>
              <StatusBadge status={risk.risk_level_inherent} />
              <span>→ Nivel residual:</span>
              <StatusBadge status={risk.risk_level_residual} />
            </div>
          </div>
        </details>
      )}

      {/* Metadata footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 flex gap-8 text-xs text-slate-500 flex-wrap">
        <div>
          <span className="font-medium">Creado:</span>{' '}
          {new Date(risk.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
        </div>
        <div>
          <span className="font-medium">Actualizado:</span>{' '}
          {new Date(risk.updated_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
        </div>
        <div>
          <span className="font-medium">ID:</span>{' '}
          <span className="font-mono">{risk.id}</span>
        </div>
      </div>
    </div>
  );
}
