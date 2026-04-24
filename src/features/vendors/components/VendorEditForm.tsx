'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updateVendor } from '../actions/vendorActions';
import type { VendorRow } from '../services/vendorService';

interface Props {
  vendor: VendorRow;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 bg-white';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const sectionHeaderClass = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

export function VendorEditForm({ vendor }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasDpa, setHasDpa] = useState(!!vendor.has_dpa);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateVendor(vendor.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/vendors/${vendor.id}`);
          router.refresh();
        }, 800);
      }
    });
  }

  if (success) {
    return (
      <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
        Cambios guardados correctamente
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
          {error}
        </div>
      )}

      {/* Informacion General */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Informacion General</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className={labelClass}>Codigo</label>
            <input
              id="code"
              name="code"
              type="text"
              defaultValue={vendor.code}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>Nombre *</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={vendor.name}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="vendor_type" className={labelClass}>Tipo de proveedor</label>
            <select
              id="vendor_type"
              name="vendor_type"
              defaultValue={vendor.vendor_type ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona —</option>
              <option value="software">Software</option>
              <option value="saas">SaaS</option>
              <option value="infrastructure">Infraestructura</option>
              <option value="professional_services">Servicios profesionales</option>
              <option value="cloud_provider">Proveedor cloud</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={vendor.status}
              className={inputClass}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
              <option value="under_evaluation">En evaluacion</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className={labelClass}>Descripcion</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={vendor.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Contacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_name" className={labelClass}>Nombre de contacto</label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              defaultValue={vendor.contact_name ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact_email" className={labelClass}>Email de contacto</label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={vendor.contact_email ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact_phone" className={labelClass}>Telefono</label>
            <input
              id="contact_phone"
              name="contact_phone"
              type="text"
              defaultValue={vendor.contact_phone ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="website" className={labelClass}>Sitio web</label>
            <input
              id="website"
              name="website"
              type="text"
              defaultValue={vendor.website ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>Pais</label>
            <input
              id="country"
              name="country"
              type="text"
              defaultValue={vendor.country ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tax_id" className={labelClass}>NIT / Tax ID</label>
            <input
              id="tax_id"
              name="tax_id"
              type="text"
              placeholder="NIT / Tax ID"
              defaultValue={vendor.tax_id ?? ''}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="data_location" className={labelClass}>Ubicacion de datos</label>
            <input
              id="data_location"
              name="data_location"
              type="text"
              placeholder="Colombia, US, UE..."
              defaultValue={vendor.data_location ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Contrato */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Contrato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contract_start" className={labelClass}>Inicio de contrato</label>
            <input
              id="contract_start"
              name="contract_start"
              type="date"
              defaultValue={vendor.contract_start ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contract_end" className={labelClass}>Fin de contrato</label>
            <input
              id="contract_end"
              name="contract_end"
              type="date"
              defaultValue={vendor.contract_end ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contract_value" className={labelClass}>Valor del contrato</label>
            <input
              id="contract_value"
              name="contract_value"
              type="number"
              min={0}
              defaultValue={vendor.contract_value ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Certificaciones */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Certificaciones y Cumplimiento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Checkbox before hidden so formData.get() returns "true" when checked, "false" when unchecked */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="has_iso27001"
              value="true"
              defaultChecked={!!vendor.has_iso27001}
              className="w-4 h-4 accent-indigo-500"
            />
            <input type="hidden" name="has_iso27001" value="false" />
            <span className="text-sm text-slate-700">ISO 27001</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="has_soc2"
              value="true"
              defaultChecked={!!vendor.has_soc2}
              className="w-4 h-4 accent-indigo-500"
            />
            <input type="hidden" name="has_soc2" value="false" />
            <span className="text-sm text-slate-700">SOC 2</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="has_pentest"
              value="true"
              defaultChecked={!!vendor.has_pentest}
              className="w-4 h-4 accent-indigo-500"
            />
            <input type="hidden" name="has_pentest" value="false" />
            <span className="text-sm text-slate-700">Pentest anual</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="has_dpa"
              value="true"
              defaultChecked={!!vendor.has_dpa}
              onChange={(e) => setHasDpa(e.target.checked)}
              className="w-4 h-4 accent-indigo-500"
            />
            <input type="hidden" name="has_dpa" value="false" />
            <span className="text-sm text-slate-700">Contrato DPA firmado</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="handles_pii"
              value="true"
              defaultChecked={!!vendor.handles_pii}
              className="w-4 h-4 accent-indigo-500"
            />
            <input type="hidden" name="handles_pii" value="false" />
            <span className="text-sm text-slate-700">Procesa datos personales (PII)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="handles_financial_data"
              value="true"
              defaultChecked={!!vendor.handles_financial_data}
              className="w-4 h-4 accent-indigo-500"
            />
            <input type="hidden" name="handles_financial_data" value="false" />
            <span className="text-sm text-slate-700">Procesa datos financieros</span>
          </label>
        </div>

        {hasDpa && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label htmlFor="dpa_signed_at" className={labelClass}>Fecha de firma del DPA</label>
            <input
              id="dpa_signed_at"
              name="dpa_signed_at"
              type="date"
              defaultValue={vendor.dpa_signed_at ?? ''}
              className={`${inputClass} max-w-xs`}
            />
          </div>
        )}
      </div>

      {/* Notas */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Notas</h2>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={vendor.notes ?? ''}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/vendors/${vendor.id}`)}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
