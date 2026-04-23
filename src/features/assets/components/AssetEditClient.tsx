'use client';

import { useRouter } from 'next/navigation';
import { AssetForm } from './AssetForm';
import type { AssetRow } from '../services/assetService';

interface Props {
  asset: AssetRow;
}

export function AssetEditClient({ asset }: Props) {
  const router = useRouter();

  return (
    <AssetForm
      onClose={() => router.push(`/assets/${asset.id}`)}
      onUpdated={() => {
        router.push(`/assets/${asset.id}`);
        router.refresh();
      }}
      initialData={asset}
      assetId={asset.id}
      defaultCategoryId={asset.category_id ?? undefined}
    />
  );
}
