import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getControlById } from '@/features/controls/services/controlService';
import { PageHeader } from '@/shared/components/PageHeader';
import { ControlEditForm } from '@/features/controls/components/ControlEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ControlEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const control = await getControlById(id);
  if (!control) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/controls/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/controls" className="hover:text-slate-700">Controles</Link>
          <span>/</span>
          <Link href={`/controls/${id}`} className="hover:text-slate-700 font-mono">{control.code}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar ${control.name}`}
        description="Actualiza los datos del control."
      />

      <ControlEditForm control={control} />
    </div>
  );
}
