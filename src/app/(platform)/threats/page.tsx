import { requireOrg } from '@/shared/lib/get-org';
import { getThreats } from '@/features/threats/services/threatService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';

const ORIGIN_LABELS: Record<string, string> = {
  natural: 'Natural',
  industrial: 'Industrial',
  human_intentional: 'Humana (Intencional)',
  human_unintentional: 'Humana (No Intencional)',
  other: 'Otro',
};

const ORIGIN_COLORS: Record<string, string> = {
  natural: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  industrial: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  human_intentional: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  human_unintentional: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  other: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

export default async function ThreatsPage() {
  const { orgId } = await requireOrg();
  const threats = await getThreats(orgId);

  const grouped = threats.reduce<Record<string, typeof threats>>((acc, threat) => {
    const origin = threat.origin || 'other';
    if (!acc[origin]) acc[origin] = [];
    acc[origin].push(threat);
    return acc;
  }, {});

  const origins = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogo de Amenazas MAGERIT"
        description={`${threats.length} amenazas catalogadas segun metodologia MAGERIT v3`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {origins.map((origin) => (
          <div key={origin} className={`rounded-xl border p-4 ${ORIGIN_COLORS[origin] || ORIGIN_COLORS.other}`}>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">
              {ORIGIN_LABELS[origin] || origin}
            </p>
            <p className="mt-1 text-2xl font-bold">{grouped[origin].length}</p>
          </div>
        ))}
      </div>

      {origins.map((origin) => (
        <div key={origin} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${ORIGIN_COLORS[origin] || ORIGIN_COLORS.other}`}>
              {ORIGIN_LABELS[origin] || origin}
            </span>
            <span className="text-sm text-slate-500">{grouped[origin].length} amenazas</span>
          </div>
          <div className="divide-y divide-slate-100">
            {grouped[origin].map((threat) => (
              <div key={threat.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs text-sky-600 w-20 shrink-0 mt-0.5">{threat.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{threat.name}</p>
                    {threat.description && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{threat.description}</p>
                    )}
                    {threat.affected_dimensions && threat.affected_dimensions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {threat.affected_dimensions.map((dim) => (
                          <span key={dim} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500 font-mono">
                            [{dim}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!threat.is_system && (
                    <StatusBadge status="active" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {threats.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-slate-500 text-sm">No hay amenazas en el catalogo</p>
          <p className="text-slate-400 text-xs mt-1">El catalogo MAGERIT se carga durante la configuracion inicial</p>
        </div>
      )}
    </div>
  );
}
