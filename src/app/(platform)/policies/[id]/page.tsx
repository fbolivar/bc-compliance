import { requireOrg } from '@/shared/lib/get-org';
import { getPolicyById } from '@/features/policies/services/policyService';
import { PageHeader } from '@/shared/components/PageHeader';
import { PolicyApproveButton } from '@/features/policies/components/PolicyApproveButton';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Edit } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

const POLICY_TYPE_LABELS: Record<string, string> = {
  policy: 'Política',
  procedure: 'Procedimiento',
  guideline: 'Directriz',
  standard: 'Estándar',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  review: 'En revisión',
  approved: 'Aprobado',
  obsolete: 'Obsoleto',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  review: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  obsolete: 'bg-slate-100 text-slate-500 border-slate-200',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-700">
        {value ?? <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null): React.ReactNode {
  if (!dateStr) return null;
  return (
    <span className="flex items-center gap-1.5">
      <Calendar className="w-3.5 h-3.5 text-slate-400" />
      {new Date(dateStr).toLocaleDateString('es-CO', { dateStyle: 'long' })}
    </span>
  );
}

export default async function PolicyDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const policy = await getPolicyById(id);
  if (!policy) notFound();

  const statusColor = STATUS_COLORS[policy.status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const statusLabel = STATUS_LABELS[policy.status] ?? policy.status;
  const typeLabel = POLICY_TYPE_LABELS[policy.policy_type] ?? policy.policy_type;

  return (
    <div className="space-y-6">
      {/* Back + header row */}
      <div className="flex items-start gap-4">
        <Link
          href="/policies"
          className="p-2 mt-1 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Volver a políticas"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <PageHeader
            title={policy.title}
            description={policy.code}
            actions={
              <Link
                href={`/policies/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </Link>
            }
          />
        </div>
      </div>

      {/* Status + type badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColor}`}>
          {statusLabel}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-600 border border-slate-200">
          {typeLabel}
        </span>
        <span className="font-mono text-xs text-slate-400">v{policy.version}</span>
        <PolicyApproveButton policyId={policy.id} status={policy.status} />
      </div>

      {/* 2-column info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Información general</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Versión" value={<span className="font-mono">{policy.version}</span>} />
            <DetailRow label="Propietario" value={policy.owner} />
            <DetailRow label="Aprobado por" value={policy.approved_by} />
            <DetailRow label="Fecha de aprobación" value={formatDate(policy.approved_at)} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Vigencia</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Fecha efectiva" value={formatDate(policy.effective_date)} />
            <DetailRow label="Fecha de revisión" value={formatDate(policy.review_date)} />
            <DetailRow
              label="Creado"
              value={
                <span className="text-slate-500">
                  {new Date(policy.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })}
                </span>
              }
            />
            <DetailRow
              label="Última actualización"
              value={
                <span className="text-slate-500">
                  {new Date(policy.updated_at).toLocaleDateString('es-CO', { dateStyle: 'long' })}
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* Content card */}
      {policy.content && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Contenido</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{policy.content}</p>
          </div>
        </div>
      )}

      {/* Description card */}
      {policy.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripción</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{policy.description}</p>
        </div>
      )}

      {/* Notes card */}
      {policy.notes && (
        <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Notas</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{policy.notes}</p>
        </div>
      )}
    </div>
  );
}
