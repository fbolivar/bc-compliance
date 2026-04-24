import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getNCById } from '@/features/nonconformities/services/ncService';
import { PageHeader } from '@/shared/components/PageHeader';
import { NCEditForm } from '@/features/nonconformities/components/NCEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function NCEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const nc = await getNCById(id);
  if (!nc) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/nonconformities/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/nonconformities" className="hover:text-slate-700">No Conformidades</Link>
          <span>/</span>
          <Link href={`/nonconformities/${id}`} className="hover:text-slate-700 font-mono">{nc.code}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar ${nc.title}`}
        description="Actualiza los datos de la no conformidad."
      />

      <NCEditForm nc={nc} />
    </div>
  );
}
