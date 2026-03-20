import { requireOrg } from '@/shared/lib/get-org';
import { getVendorById } from '@/features/vendors/services/vendorService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Mail, Phone, Calendar } from 'lucide-react';

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

export default async function VendorDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const vendor = await getVendorById(id);

  if (!vendor) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendors" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={vendor.name}
          description={`${vendor.code} | ${vendor.category?.replace(/_/g, ' ') || 'Proveedor'}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={vendor.status} />
        {vendor.risk_level && <StatusBadge status={vendor.risk_level} />}
        {vendor.data_processing && (
          <span className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Procesa datos personales
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{vendor.code}</span>} />
            <DetailRow label="Categoria" value={vendor.category?.replace(/_/g, ' ')} />
            <DetailRow label="Estado" value={<StatusBadge status={vendor.status} />} />
            <DetailRow label="Nivel de riesgo" value={vendor.risk_level ? <StatusBadge status={vendor.risk_level} /> : null} />
            <DetailRow label="Pais" value={vendor.country} />
            {vendor.website && (
              <DetailRow label="Sitio web" value={
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-500 hover:text-sky-600">
                  <Globe className="w-3.5 h-3.5" />
                  {vendor.website}
                </a>
              } />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Contacto y Contrato</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Contacto" value={vendor.contact_name} />
            {vendor.contact_email && (
              <DetailRow label="Email" value={
                <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-1 text-sky-500 hover:text-sky-600">
                  <Mail className="w-3.5 h-3.5" />
                  {vendor.contact_email}
                </a>
              } />
            )}
            {vendor.contact_phone && (
              <DetailRow label="Telefono" value={
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {vendor.contact_phone}
                </span>
              } />
            )}
            <DetailRow label="Inicio contrato" value={vendor.contract_start ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(vendor.contract_start).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fin contrato" value={vendor.contract_end ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(vendor.contract_end).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
          </div>
        </div>
      </div>

      {vendor.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{vendor.description}</p>
        </div>
      )}

      {vendor.sla_terms && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Terminos SLA</h2>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{vendor.sla_terms}</p>
        </div>
      )}
    </div>
  );
}
