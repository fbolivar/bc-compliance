import { requireOrg } from '@/shared/lib/get-org';
import { getVulnerabilityById } from '@/features/vulnerabilities/services/vulnService';
import {
  getRisksForVulnerability,
  getAvailableRisksForVulnerability,
} from '@/features/compliance/services/relationshipService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { VulnRisksPanel } from '@/features/vulnerabilities/components/VulnRisksPanel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Calendar, Server } from 'lucide-react';
import { ActionPlanEditor } from '@/features/vulnerabilities/components/ActionPlanEditor';

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-700">{value || <span className="text-slate-400">-</span>}</div>
    </div>
  );
}

export default async function VulnerabilityDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [vuln, associatedRisks, availableRisks] = await Promise.all([
    getVulnerabilityById(id),
    getRisksForVulnerability(id),
    getAvailableRisksForVulnerability(orgId, id),
  ]);

  if (!vuln) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vulnerabilities" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={vuln.title}
          description={`${vuln.code} ${vuln.cve_id ? `| ${vuln.cve_id}` : ''}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={vuln.severity} />
        <StatusBadge status={vuln.status} />
        {vuln.cvss_base_score !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Shield className="w-3 h-3" />
            CVSS {vuln.cvss_base_score}
          </span>
        )}
        {vuln.source && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-sky-50 text-sky-600 border border-sky-200">
            {vuln.source}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{vuln.code}</span>} />
            <DetailRow label="ID CVE" value={vuln.cve_id ? <span className="font-mono text-amber-600">{vuln.cve_id}</span> : null} />
            <DetailRow label="Severidad" value={<StatusBadge status={vuln.severity} />} />
            <DetailRow label="Estado" value={<StatusBadge status={vuln.status} />} />
            <DetailRow label="Score CVSS" value={vuln.cvss_base_score !== null ? <span className="font-mono">{vuln.cvss_base_score}/10</span> : null} />
            <DetailRow label="Fuente" value={vuln.source} />
          </div>
        </div>

        {/* Host Afectado */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            <Server className="w-4 h-4" />
            Host Afectado
          </h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Host / IP" value={vuln.affected_host ? <span className="font-mono text-slate-700">{vuln.affected_host}</span> : null} />
            <DetailRow label="Puerto" value={vuln.affected_port ? <span className="font-mono">{vuln.affected_port}</span> : null} />
            <DetailRow label="Sistema Operativo" value={vuln.affected_os} />
            <DetailRow label="Producto Afectado" value={vuln.affected_product} />
            <DetailRow label="Fecha limite" value={vuln.due_date ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(vuln.due_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
          </div>
        </div>
      </div>

      {/* Description */}
      {vuln.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{vuln.description}</p>
        </div>
      )}

      {/* Remediation + Action Plan (editable) */}
      <ActionPlanEditor
        vulnId={vuln.id}
        currentPlan={vuln.action_plan}
        currentResponsible={vuln.action_responsible}
        currentPriority={vuln.action_priority}
        currentStatus={vuln.action_status}
        currentRemediation={vuln.remediation}
        currentDueDate={vuln.due_date}
      />

      {/* Integración: riesgos asociados */}
      <VulnRisksPanel
        vulnerabilityId={vuln.id}
        items={associatedRisks}
        availableRisks={availableRisks}
      />

      {/* Dates */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Registro</h2>
        <div className="divide-y divide-slate-100">
          <DetailRow label="Creado" value={new Date(vuln.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          <DetailRow label="Actualizado" value={new Date(vuln.updated_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
        </div>
      </div>
    </div>
  );
}
