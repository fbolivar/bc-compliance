import { requireOrg } from '@/shared/lib/get-org';
import { getVulnerabilityById } from '@/features/vulnerabilities/services/vulnService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Calendar } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-800/50 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-200">{value || <span className="text-slate-600">-</span>}</div>
    </div>
  );
}

export default async function VulnerabilityDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const vuln = await getVulnerabilityById(id);

  if (!vuln) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vulnerabilities" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={vuln.name}
          description={`${vuln.code} ${vuln.cve_id ? `| ${vuln.cve_id}` : ''}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={vuln.severity} />
        <StatusBadge status={vuln.status} />
        {vuln.cvss_score !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Shield className="w-3 h-3" />
            CVSS {vuln.cvss_score}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-800/50">
            <DetailRow label="Codigo" value={<span className="font-mono text-cyan-400">{vuln.code}</span>} />
            <DetailRow label="ID CVE" value={vuln.cve_id ? (
              <span className="font-mono text-amber-400">{vuln.cve_id}</span>
            ) : null} />
            <DetailRow label="Severidad" value={<StatusBadge status={vuln.severity} />} />
            <DetailRow label="Estado" value={<StatusBadge status={vuln.status} />} />
            <DetailRow label="Score CVSS" value={vuln.cvss_score !== null ? (
              <span className="font-mono">{vuln.cvss_score}/10</span>
            ) : null} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Fechas</h2>
          <div className="divide-y divide-slate-800/50">
            <DetailRow label="Fecha de descubrimiento" value={vuln.discovery_date ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(vuln.discovery_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fecha limite" value={vuln.due_date ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(vuln.due_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Creado" value={new Date(vuln.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
            <DetailRow label="Actualizado" value={new Date(vuln.updated_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          </div>
        </div>
      </div>

      {vuln.description && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{vuln.description}</p>
        </div>
      )}

      {vuln.remediation_notes && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Notas de Remediacion</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{vuln.remediation_notes}</p>
        </div>
      )}
    </div>
  );
}
