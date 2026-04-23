import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { SoaTable } from '@/features/compliance/components/SoaTable';
import { getControlMappingsByRequirements } from '@/features/compliance/services/complianceService';
import { CheckCircle2, CircleDashed, AlertCircle, MinusCircle, BarChart3, FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SoaPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { data: soaData } = await supabase
    .from('soa_entries')
    .select(
      'id, is_applicable, justification, compliance_status, implementation_status, notes, requirement_id, framework_requirements(id, code, name, description, framework_id, frameworks(id, name))',
    )
    .eq('organization_id', orgId)
    .order('created_at');

  const entries = soaData ?? [];

  // Fetch control mappings for all requirements in SOA
  const requirementIds = entries
    .map((e) => e.requirement_id)
    .filter((id): id is string => Boolean(id));
  const controlMappings = await getControlMappingsByRequirements(requirementIds);

  // Derive unique frameworks for the filter
  const frameworkMap = new Map<string, { id: string; name: string }>();
  for (const e of entries) {
    const fw = (e.framework_requirements as unknown as { frameworks?: { id: string; name: string } | null })?.frameworks;
    if (fw?.id && fw?.name) {
      frameworkMap.set(fw.id, { id: fw.id, name: fw.name });
    }
  }
  const frameworks = Array.from(frameworkMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // Summary stats
  const total = entries.length;
  const implemented = entries.filter((e) => e.implementation_status === 'implemented').length;
  const partial = entries.filter(
    (e) => e.implementation_status === 'partially_implemented',
  ).length;
  const notImplemented = entries.filter(
    (e) => e.implementation_status === 'not_implemented',
  ).length;
  const notApplicable = entries.filter(
    (e) => e.implementation_status === 'not_applicable',
  ).length;
  const planned = entries.filter((e) => e.implementation_status === 'planned').length;

  const implementedPct = total > 0 ? Math.round(((implemented + partial * 0.5) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Declaracion de Aplicabilidad (SOA)"
          description="Statement of Applicability — estado de implementacion de todos los requisitos normativos"
        />
        <div className="flex items-center gap-2">
          {frameworks.map((fw) => (
            <a
              key={fw.id}
              href={`/api/compliance/soa/export?framework_id=${fw.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title={`Descargar SOA de ${fw.name}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              {fw.name}
            </a>
          )).slice(0, 2)}
          <a
            href="/api/compliance/soa/export"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar SOA (todos)
          </a>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total requisitos"
          value={total}
          icon={<BarChart3 className="w-4 h-4 text-slate-400" />}
          colorClass="border-slate-200 bg-white"
          valueClass="text-slate-700"
        />
        <StatCard
          label="Implementados"
          value={implemented}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          colorClass="border-emerald-200 bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Parciales"
          value={partial}
          icon={<CircleDashed className="w-4 h-4 text-amber-500" />}
          colorClass="border-amber-200 bg-amber-50"
          valueClass="text-amber-700"
        />
        <StatCard
          label="No implementados"
          value={notImplemented}
          icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
          colorClass="border-rose-200 bg-rose-50"
          valueClass="text-rose-700"
        />
        <StatCard
          label="No aplicables"
          value={notApplicable + planned}
          icon={<MinusCircle className="w-4 h-4 text-slate-400" />}
          colorClass="border-slate-200 bg-slate-50"
          valueClass="text-slate-500"
        />
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Progreso de cumplimiento</span>
          <span className="text-sm font-semibold text-sky-600">{implementedPct}%</span>
        </div>
        <meter
          value={implementedPct}
          min={0}
          max={100}
          title={`${implementedPct}% implementado`}
          className="w-full h-2.5 [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:bg-slate-100 [&::-webkit-meter-optimum-value]:rounded-full [&::-webkit-meter-optimum-value]:bg-sky-500"
        />
        <div className="mt-2 flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Implementado: {implemented}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Parcial: {partial}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Brecha: {notImplemented}
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-slate-500">No hay entradas SOA registradas</p>
          <p className="text-xs text-slate-400 mt-1">
            Las entradas SOA se generan al mapear controles a requisitos de frameworks.
          </p>
        </div>
      ) : (
        <SoaTable
          entries={entries as unknown as Parameters<typeof SoaTable>[0]['entries']}
          frameworks={frameworks}
          controlMappings={controlMappings}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  valueClass: string;
}

function StatCard({ label, value, icon, colorClass, valueClass }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${colorClass}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
