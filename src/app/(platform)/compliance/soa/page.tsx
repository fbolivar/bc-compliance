import { requireOrg } from '@/shared/lib/get-org';
import { getSoaEntries } from '@/features/compliance/services/complianceService';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import Link from 'next/link';

export default async function SoaPage() {
  const { orgId } = await requireOrg();
  const soaEntries = await getSoaEntries(orgId);
  const supabase = await createClient();

  // Enrich with requirement and control data
  const reqIds = [...new Set(soaEntries.map((e) => e.requirement_id).filter(Boolean))];
  const ctrlIds = [...new Set(soaEntries.map((e) => e.control_id).filter(Boolean))];

  const [{ data: requirements }, { data: controls }] = await Promise.all([
    reqIds.length > 0
      ? supabase.from('framework_requirements').select('id, code, title, framework_id, frameworks(name)').in('id', reqIds)
      : { data: [] },
    ctrlIds.length > 0
      ? supabase.from('controls').select('id, code, name').in('id', ctrlIds)
      : { data: [] },
  ]);

  const reqMap = new Map((requirements || []).map((r) => [r.id, r]));
  const ctrlMap = new Map((controls || []).map((c) => [c.id, c]));

  const byApplicability = soaEntries.reduce<Record<string, typeof soaEntries>>((acc, entry) => {
    const key = entry.applicability || 'applicable';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Declaracion de Aplicabilidad (SOA)"
        description="Statement of Applicability - Relacion de controles aplicables y su justificacion"
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Entradas SOA</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">{soaEntries.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-400">Implementados</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">
            {soaEntries.filter((e) => e.implementation_status === 'implemented').length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-400">No Aplicables</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">
            {soaEntries.filter((e) => e.applicability === 'not_applicable').length}
          </p>
        </div>
      </div>

      {soaEntries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-slate-500">No hay entradas SOA registradas</p>
          <p className="text-xs text-slate-400 mt-1">Las entradas SOA se generan al mapear controles a requisitos de frameworks</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Framework</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Requisito</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Control</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Aplicabilidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Justificacion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {soaEntries.map((entry) => {
                  const req = reqMap.get(entry.requirement_id);
                  const ctrl = entry.control_id ? ctrlMap.get(entry.control_id) : null;
                  const fw = req ? (req as unknown as { frameworks?: { name: string } }).frameworks : null;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-400">{fw?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-sky-600">{req?.code}</p>
                        <p className="text-sm text-slate-600">{req?.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        {ctrl ? (
                          <>
                            <p className="font-mono text-xs text-slate-500">{ctrl.code}</p>
                            <p className="text-sm text-slate-600">{ctrl.name}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.applicability || 'applicable'} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.implementation_status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                        {entry.justification || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
