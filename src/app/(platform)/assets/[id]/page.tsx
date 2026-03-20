import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAssetById } from '@/features/assets/services/assetService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { ArrowLeft, Shield } from 'lucide-react';

// Maps integer 0-10 to a fixed Tailwind width class, avoiding inline styles.
const MAGERIT_WIDTH: Record<number, string> = {
  0:  'w-0',
  1:  'w-[10%]',
  2:  'w-[20%]',
  3:  'w-[30%]',
  4:  'w-[40%]',
  5:  'w-[50%]',
  6:  'w-[60%]',
  7:  'w-[70%]',
  8:  'w-[80%]',
  9:  'w-[90%]',
  10: 'w-full',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params;
  const asset = await getAssetById(id);

  if (!asset) notFound();

  const mageritValues = [
    { label: 'Confidencialidad', value: asset.val_confidentiality, color: 'text-sky-600' },
    { label: 'Integridad', value: asset.val_integrity, color: 'text-blue-400' },
    { label: 'Disponibilidad', value: asset.val_availability, color: 'text-emerald-400' },
    { label: 'Autenticidad', value: asset.val_authenticity, color: 'text-amber-400' },
    { label: 'Trazabilidad', value: asset.val_traceability, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets" className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader title={asset.name} description={`${asset.code} - ${asset.asset_type}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-slate-500">Tipo</dt>
                <dd className="text-sm text-slate-700 capitalize">{asset.asset_type.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Estado</dt>
                <dd><StatusBadge status={asset.status} /></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Criticidad</dt>
                <dd><StatusBadge status={asset.criticality} /></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Departamento</dt>
                <dd className="text-sm text-slate-700">{asset.department || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Ubicacion</dt>
                <dd className="text-sm text-slate-700">{asset.location || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Clasificacion</dt>
                <dd className="text-sm text-slate-700 capitalize">{asset.data_classification || '-'}</dd>
              </div>
            </dl>
            {asset.description && (
              <dl className="mt-4 pt-4 border-t border-slate-200">
                <dt className="text-xs text-slate-500 mb-1">Descripcion</dt>
                <dd className="text-sm text-slate-600">{asset.description}</dd>
              </dl>
            )}
          </div>

          {/* Technical info */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion Tecnica</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-slate-500">IP</dt>
                <dd className="text-sm font-mono text-slate-700">{asset.ip_address || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Hostname</dt>
                <dd className="text-sm font-mono text-slate-700">{asset.hostname || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Flags */}
          <div className="flex gap-3">
            {asset.is_critical && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                <Shield className="w-3.5 h-3.5" /> Activo Critico
              </span>
            )}
            {asset.pii_data && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                PII
              </span>
            )}
            {asset.financial_data && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                Datos Financieros
              </span>
            )}
          </div>
        </div>

        {/* MAGERIT sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4">Valoracion MAGERIT</h3>
            <div className="space-y-3">
              {mageritValues.map(v => (
                <div key={v.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{v.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-current ${v.color} ${MAGERIT_WIDTH[Math.min(10, Math.max(0, Math.round(v.value)))] ?? 'w-0'}`}
                      />
                    </div>
                    <span className={`text-sm font-mono font-bold ${v.color}`}>{v.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Metadatos</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Creado</dt>
                <dd className="text-xs text-slate-400">{new Date(asset.created_at).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Actualizado</dt>
                <dd className="text-xs text-slate-400">{new Date(asset.updated_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
