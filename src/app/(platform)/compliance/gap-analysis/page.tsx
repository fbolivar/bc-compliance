import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { GapList } from '@/features/compliance/components/GapList';
import { AlertTriangle, CircleDashed, CircleOff, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GapAnalysisPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Fetch all SOA entries with requirement and framework info
  const { data: soaData } = await supabase
    .from('soa_entries')
    .select(
      'id, implementation_status, requirement_id, framework_requirements(id, code, name, description, framework_id, frameworks(id, name))',
    )
    .eq('organization_id', orgId)
    .order('created_at');

  const allEntries = soaData ?? [];
  const totalEntries = allEntries.length;

  // Gaps = everything that is NOT fully implemented
  const gapEntries = allEntries.filter(
    (e) => e.implementation_status !== 'implemented' && e.implementation_status !== 'not_applicable',
  );

  // Summary counts
  const notImplementedCount = gapEntries.filter(
    (e) => e.implementation_status === 'not_implemented',
  ).length;
  const partialCount = gapEntries.filter(
    (e) => e.implementation_status === 'partially_implemented',
  ).length;
  const plannedCount = gapEntries.filter(
    (e) => e.implementation_status === 'planned',
  ).length;
  const notAssessedCount = gapEntries.filter(
    (e) => e.implementation_status === 'not_assessed' || !e.implementation_status,
  ).length;

  // Derive unique frameworks from gap entries
  const frameworkMap = new Map<string, { id: string; name: string }>();
  for (const e of gapEntries) {
    const fw = (
      e.framework_requirements as unknown as {
        frameworks?: { id: string; name: string } | null;
      }
    )?.frameworks;
    if (fw?.id && fw?.name) {
      frameworkMap.set(fw.id, { id: fw.id, name: fw.name });
    }
  }
  const frameworks = Array.from(frameworkMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analisis de Brechas"
        description="Requisitos normativos no cumplidos que requieren atencion"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="No implementados"
          value={notImplementedCount}
          icon={<CircleOff className="w-4 h-4 text-rose-500" />}
          colorClass="border-rose-200 bg-rose-50"
          valueClass="text-rose-700"
        />
        <SummaryCard
          label="Parcialmente implementados"
          value={partialCount}
          icon={<CircleDashed className="w-4 h-4 text-amber-500" />}
          colorClass="border-amber-200 bg-amber-50"
          valueClass="text-amber-700"
        />
        <SummaryCard
          label="Planificados"
          value={plannedCount}
          icon={<AlertTriangle className="w-4 h-4 text-sky-500" />}
          colorClass="border-sky-200 bg-sky-50"
          valueClass="text-sky-700"
        />
        <SummaryCard
          label="Sin evaluar"
          value={notAssessedCount}
          icon={<HelpCircle className="w-4 h-4 text-slate-400" />}
          colorClass="border-slate-200 bg-slate-50"
          valueClass="text-slate-600"
        />
      </div>

      {gapEntries.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 py-16 text-center">
          <p className="text-sm font-medium text-emerald-700">
            Excelente! No se detectaron brechas de cumplimiento
          </p>
          <p className="text-xs text-emerald-600/70 mt-1">
            Todos los requisitos evaluados estan implementados
          </p>
        </div>
      ) : (
        <GapList
          entries={gapEntries as unknown as Parameters<typeof GapList>[0]['entries']}
          frameworks={frameworks}
          totalEntries={totalEntries}
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  valueClass: string;
}

function SummaryCard({ label, value, icon, colorClass, valueClass }: SummaryCardProps) {
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
