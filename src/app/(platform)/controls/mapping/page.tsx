import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';

export default async function ControlsMappingPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Get control-requirement mappings
  const { data: mappings } = await supabase
    .from('control_requirement_mappings')
    .select(`
      id,
      control_id,
      requirement_id,
      coverage,
      notes,
      controls(code, name, status),
      framework_requirements(code, title, framework_id, frameworks(name))
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100);

  const items = mappings || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapeo de Controles"
        description="Mapeo de controles a requisitos de frameworks normativos"
      />

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-400">{items.length} mapeos registrados</p>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">No hay mapeos de controles registrados</p>
            <p className="text-xs text-slate-600 mt-1">Los mapeos se crean al vincular controles con requisitos normativos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Control</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Framework</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Requisito</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((mapping) => {
                  const control = mapping.controls as unknown as { code: string; name: string; status: string } | null;
                  const req = mapping.framework_requirements as unknown as { code: string; title: string; frameworks: { name: string } | null } | null;

                  return (
                    <tr key={mapping.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-sky-600">{control?.code}</p>
                        <p className="text-sm text-slate-600">{control?.name}</p>
                        {control?.status && <StatusBadge status={control.status} />}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {req?.frameworks?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-slate-500">{req?.code}</p>
                        <p className="text-sm text-slate-600">{req?.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        {mapping.coverage ? <StatusBadge status={mapping.coverage as string} /> : <span className="text-slate-600">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
