import { requireOrg } from '@/shared/lib/get-org';
import {
  getDocumentById,
  getAttachmentsForDocument,
} from '@/features/documents/services/documentService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { DocumentFilePanel } from '@/features/documents/components/DocumentFilePanel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, Lock, Shield, Clock } from 'lucide-react';

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

function ConfidentialityBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const labels: Record<string, string> = {
    public: 'Público',
    internal: 'Interno',
    confidential: 'Confidencial',
    restricted: 'Restringido',
  };
  const colors: Record<string, string> = {
    public: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    internal: 'bg-sky-50 text-sky-700 border-sky-200',
    confidential: 'bg-amber-50 text-amber-700 border-amber-200',
    restricted: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${colors[level] ?? colors.internal}`}>
      <Lock className="w-3 h-3" />
      {labels[level] ?? level}
    </span>
  );
}

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const [doc, attachments] = await Promise.all([
    getDocumentById(id),
    getAttachmentsForDocument(id),
  ]);

  if (!doc) notFound();

  const today = new Date();
  const reviewDate = doc.review_date ? new Date(doc.review_date) : null;
  const expiryDate = doc.expiry_date ? new Date(doc.expiry_date) : null;
  const isReviewDue = reviewDate && reviewDate <= today;
  const isExpiringSoon = expiryDate && expiryDate > today &&
    expiryDate.getTime() - today.getTime() < 60 * 86400000;
  const isExpired = expiryDate && expiryDate < today;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={doc.title}
          description={`${doc.code}${doc.version ? ` · v${doc.version}` : ''}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={doc.status} />
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
          <FileText className="w-3 h-3" />
          {doc.document_type?.replace(/_/g, ' ')}
        </span>
        <ConfidentialityBadge level={doc.confidentiality} />
        {doc.category && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {doc.category}
          </span>
        )}
        {isExpired && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Clock className="w-3 h-3" />
            Vencido
          </span>
        )}
        {isExpiringSoon && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Vence pronto
          </span>
        )}
        {isReviewDue && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Calendar className="w-3 h-3" />
            Revisión pendiente
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Información General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Código" value={<span className="font-mono text-sky-600">{doc.code}</span>} />
            <DetailRow label="Título" value={doc.title} />
            <DetailRow label="Tipo" value={doc.document_type?.replace(/_/g, ' ')} />
            <DetailRow label="Estado" value={<StatusBadge status={doc.status} />} />
            <DetailRow label="Versión" value={doc.version ? <span className="font-mono">v{doc.version}</span> : null} />
            <DetailRow label="Categoría" value={doc.category} />
            <DetailRow label="Departamento" value={doc.department} />
            <DetailRow label="Confidencialidad" value={<ConfidentialityBadge level={doc.confidentiality} />} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Ciclo de Vida</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Publicado" value={doc.published_at ? new Date(doc.published_at).toLocaleDateString('es-CO', { dateStyle: 'long' }) : null} />
            <DetailRow label="Aprobado" value={doc.approved_at ? new Date(doc.approved_at).toLocaleDateString('es-CO', { dateStyle: 'long' }) : null} />
            <DetailRow label="Próxima revisión" value={reviewDate ? (
              <span className={`flex items-center gap-1.5 ${isReviewDue ? 'text-amber-600 font-medium' : ''}`}>
                <Calendar className="w-3.5 h-3.5" />
                {reviewDate.toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Vencimiento" value={expiryDate ? (
              <span className={`flex items-center gap-1.5 ${isExpired ? 'text-rose-600 font-medium' : isExpiringSoon ? 'text-amber-600 font-medium' : ''}`}>
                <Calendar className="w-3.5 h-3.5" />
                {expiryDate.toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Retención" value={doc.retention_period_months ? `${doc.retention_period_months} meses` : null} />
            <DetailRow label="Disposición" value={doc.disposal_date ? new Date(doc.disposal_date).toLocaleDateString('es-CO', { dateStyle: 'long' }) : null} />
            <DetailRow label="Creado" value={new Date(doc.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
            <DetailRow label="Actualizado" value={new Date(doc.updated_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          </div>
        </div>
      </div>

      {doc.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripción</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{doc.description}</p>
        </div>
      )}

      {/* Archivos múltiples con upload/download/remove */}
      <DocumentFilePanel documentId={doc.id} attachments={attachments} />

      {/* Control de autoría (simplificado sin lookup a auth.users aún) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          <Shield className="w-4 h-4" />
          Control de Autoría
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="pr-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Autor</p>
            <p className="text-sm text-slate-600">{doc.author_id ? <span className="font-mono text-xs">{doc.author_id.substring(0, 8)}...</span> : <span className="text-slate-400">—</span>}</p>
          </div>
          <div className="px-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Revisor</p>
            <p className="text-sm text-slate-600">{doc.reviewer_id ? <span className="font-mono text-xs">{doc.reviewer_id.substring(0, 8)}...</span> : <span className="text-slate-400">—</span>}</p>
          </div>
          <div className="pl-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Aprobador</p>
            <p className="text-sm text-slate-600">{doc.approver_id ? <span className="font-mono text-xs">{doc.approver_id.substring(0, 8)}...</span> : <span className="text-slate-400">—</span>}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
