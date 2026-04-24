import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getAuditById } from '@/features/audits/services/auditService';
import { PageHeader } from '@/shared/components/PageHeader';
import { AuditEditForm } from '@/features/audits/components/AuditEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AuditEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const audit = await getAuditById(id);
  if (!audit) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/audits/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/audits" className="hover:text-slate-700">Auditorias</Link>
          <span>/</span>
          <Link href={`/audits/${id}`} className="hover:text-slate-700 font-mono">{audit.code}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar ${audit.title}`}
        description="Actualiza los datos del programa de auditoria."
      />

      <AuditEditForm audit={audit} />
    </div>
  );
}
