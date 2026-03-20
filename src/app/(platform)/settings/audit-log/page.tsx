import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'text-emerald-400 bg-emerald-400/10',
  update: 'text-sky-600 bg-sky-50',
  delete: 'text-rose-400 bg-rose-400/10',
  login: 'text-blue-400 bg-blue-400/10',
  logout: 'text-slate-400 bg-slate-400/10',
  export: 'text-amber-400 bg-amber-400/10',
  view: 'text-slate-400 bg-slate-400/5',
};

export default async function AuditLogPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const page = Number(params.page) || 1;
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: logs, count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to);

  const logList = logs || [];
  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Log de Auditoria"
          description="Registro inmutable de todas las acciones realizadas en el sistema"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <Lock className="w-4 h-4 text-amber-400" />
        <p className="text-xs text-amber-400">
          Este registro es de solo lectura e inmutable. No es posible modificar ni eliminar entradas.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Accion</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tabla</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descripcion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-500">No hay registros de auditoria</p>
                  </td>
                </tr>
              ) : (
                logList.map((log) => {
                  const action = (log as Record<string, unknown>).action as string || 'view';
                  const colorClass = ACTION_COLORS[action] || ACTION_COLORS.view;

                  return (
                    <tr key={(log as Record<string, unknown>).id as string} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                        {new Date((log as Record<string, unknown>).created_at as string).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colorClass}`}>
                          {action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">
                        {(log as Record<string, unknown>).table_name as string || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500 truncate max-w-[120px]">
                        {(log as Record<string, unknown>).user_id as string || 'sistema'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {(log as Record<string, unknown>).description as string || (log as Record<string, unknown>).details as string || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">{count} registros</p>
            <div className="flex items-center gap-2 text-xs">
              {page > 1 && (
                <Link href={`/settings/audit-log?page=${page - 1}`} className="px-3 py-1 text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300">
                  Anterior
                </Link>
              )}
              <span className="text-slate-500">Pagina {page} de {totalPages}</span>
              {page < totalPages && (
                <Link href={`/settings/audit-log?page=${page + 1}`} className="px-3 py-1 text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300">
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
