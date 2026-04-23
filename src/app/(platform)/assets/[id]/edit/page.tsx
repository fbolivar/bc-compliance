import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getAssetById } from '@/features/assets/services/assetService';
import { PageHeader } from '@/shared/components/PageHeader';
import { AssetEditClient } from '@/features/assets/components/AssetEditClient';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AssetEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const asset = await getAssetById(id);
  if (!asset) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/assets/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/assets" className="hover:text-slate-700">Activos</Link>
          <span>/</span>
          <Link href={`/assets/${id}`} className="hover:text-slate-700 font-mono">{asset.code}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar ${asset.name}`}
        description={`Actualiza los datos del activo ${asset.code}. Los cambios se guardan al pulsar "Guardar cambios".`}
      />

      <AssetEditClient asset={asset} />
    </div>
  );
}
