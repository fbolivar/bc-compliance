'use client';

import { useState, useRef } from 'react';
import { updateOrganization } from '@/actions/organization';
import { createClient } from '@/lib/supabase/client';
import { Building2, Save, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

interface OrgData {
  id: string;
  name: string;
  slug: string;
  tax_id: string | null;
  industry: string | null;
  country: string | null;
  address: string | null;
  plan: string;
  logo_url: string | null;
}

interface OrgSettingsFormProps {
  organization: OrgData;
}

const industries = [
  'Banca y Finanzas',
  'Gobierno',
  'Telecomunicaciones',
  'Salud',
  'Energia',
  'Tecnologia',
  'Educacion',
  'Retail',
  'Manufactura',
  'Seguros',
  'Transporte',
  'Otra',
];

const countries = [
  'Colombia', 'Mexico', 'Chile', 'Peru', 'Argentina', 'Ecuador',
  'Panama', 'Costa Rica', 'Republica Dominicana', 'Espana', 'Estados Unidos', 'Otro',
];

export function OrgSettingsForm({ organization }: OrgSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState(organization.logo_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'El logo no puede superar 2MB' });
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Formato no soportado. Usa PNG, JPG, SVG o WebP' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const filePath = `${organization.id}/logo.${ext}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setMessage({ type: 'error', text: uploadError.message });
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('org-logos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update org record
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);

      if (updateError) {
        setMessage({ type: 'error', text: updateError.message });
      } else {
        setLogoUrl(publicUrl);
        setMessage({ type: 'success', text: 'Logo actualizado' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al subir el logo' });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveLogo = async () => {
    setUploading(true);
    try {
      const supabase = createClient();
      await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', organization.id);

      // Try to delete file from storage
      await supabase.storage
        .from('org-logos')
        .remove([`${organization.id}/logo.png`, `${organization.id}/logo.jpg`, `${organization.id}/logo.svg`, `${organization.id}/logo.webp`, `${organization.id}/logo.jpeg`]);

      setLogoUrl(null);
      setMessage({ type: 'success', text: 'Logo eliminado' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar el logo' });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set('org_id', organization.id);
    const result = await updateOrganization(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Organizacion actualizada exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-2.5 sm:py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Logo Upload */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-slate-600" />
            )}
          </div>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              disabled={uploading}
              title="Eliminar logo"
              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <label className={labelClass}>Logo de la organizacion</label>
          <p className="text-xs text-slate-500 mb-2">
            PNG, JPG, SVG o WebP. Maximo 2MB. Se usara en reportes y documentos.
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer transition-colors">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? 'Subiendo...' : 'Subir logo'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Org Data Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre de la organizacion</label>
            <input type="text" name="name" defaultValue={organization.name} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Slug (URL)</label>
            <input
              type="text"
              name="slug"
              defaultValue={organization.slug}
              required
              pattern="[a-z0-9-]+"
              title="Solo letras minusculas, numeros y guiones"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>NIT / Tax ID</label>
            <input
              type="text"
              name="tax_id"
              defaultValue={organization.tax_id || ''}
              placeholder="900.123.456-7"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Industria</label>
            <select name="industry" defaultValue={organization.industry || ''} className={inputClass}>
              <option value="">Seleccionar...</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Pais</label>
            <select name="country" defaultValue={organization.country || ''} className={inputClass}>
              <option value="">Seleccionar...</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Direccion</label>
            <input
              type="text"
              name="address"
              defaultValue={organization.address || ''}
              placeholder="Calle 100 #10-20"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4" />
            <span>Plan: <span className="text-cyan-400 capitalize">{organization.plan}</span></span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 sm:py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
