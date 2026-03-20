import { requireOrg } from '@/shared/lib/get-org';
import { getEvidence } from '@/features/documents/services/documentService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import Link from 'next/link';
import { ArrowLeft, FileCheck } from 'lucide-react';

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function EvidencePage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getEvidence(orgId, { page, pageSize: 25 });
  const evidence = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Repositorio de Evidencias"
          description={`${result.count} evidencias de cumplimiento registradas`}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {evidence.length === 0 ? (
          <div className="py-16 text-center">
            <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No hay evidencias registradas</p>
            <p className="text-xs text-slate-600 mt-1">Las evidencias se asocian a controles, auditorias y requisitos de compliance</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Codigo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-sky-600">{ev.code}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{ev.name}</p>
                      {ev.description && <p className="text-xs text-slate-500 truncate">{ev.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 capitalize">
                      {ev.evidence_type?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ev.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {ev.collected_date ? new Date(ev.collected_date).toLocaleDateString('es-CO') : '-'}
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
