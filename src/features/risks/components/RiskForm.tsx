'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createRisk } from '../actions/riskActions';
import { createClient } from '@/lib/supabase/client';

const TREATMENTS = [
  { value: 'mitigate', label: 'Mitigar' },
  { value: 'transfer', label: 'Transferir' },
  { value: 'accept', label: 'Aceptar' },
  { value: 'avoid', label: 'Evitar' },
  { value: 'share', label: 'Compartir' },
];

const FREQUENCIES = [
  { value: '0', label: '0 - Muy raro (siglos)' },
  { value: '1', label: '1 - Raro (decadas)' },
  { value: '2', label: '2 - Infrecuente (anual)' },
  { value: '3', label: '3 - Normal (mensual)' },
  { value: '4', label: '4 - Frecuente (semanal)' },
  { value: '5', label: '5 - Muy frecuente (diario)' },
];

interface RiskFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RiskForm({ isOpen, onClose }: RiskFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<{ value: string; label: string }[]>([]);
  const [threats, setThreats] = useState<{ value: string; label: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();

    supabase.from('assets').select('id, code, name').order('code').then(({ data }) => {
      setAssets((data || []).map(a => ({ value: a.id, label: `${a.code} - ${a.name}` })));
    });

    supabase.from('threat_catalog').select('id, code, name').order('code').then(({ data }) => {
      setThreats((data || []).map(t => ({ value: t.id, label: `${t.code} - ${t.name}` })));
    });
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createRisk(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      router.refresh();
    }
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Nuevo Escenario de Riesgo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Codigo" name="code" required placeholder="RSK-001" />
          <FormField label="Nombre" name="name" required placeholder="Acceso no autorizado al servidor" />
        </div>

        <FormField label="Descripcion" name="description" type="textarea" placeholder="Descripcion del escenario de riesgo..." />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Activo" name="asset_id" type="select" required options={assets} />
          <FormField label="Amenaza" name="threat_id" type="select" required options={threats} />
        </div>

        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs font-medium text-sky-600 uppercase tracking-wider mb-3">Degradacion por dimension (%)</p>
          <div className="grid grid-cols-5 gap-3">
            <FormField label="[C]" name="degradation_c" type="number" min={0} max={100} defaultValue={0} />
            <FormField label="[I]" name="degradation_i" type="number" min={0} max={100} defaultValue={0} />
            <FormField label="[D]" name="degradation_a" type="number" min={0} max={100} defaultValue={0} />
            <FormField label="[A]" name="degradation_au" type="number" min={0} max={100} defaultValue={0} />
            <FormField label="[T]" name="degradation_t" type="number" min={0} max={100} defaultValue={0} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Frecuencia (MAGERIT)" name="frequency" type="select" required options={FREQUENCIES} defaultValue="2" />
          <FormField label="Tratamiento" name="treatment" type="select" options={TREATMENTS} defaultValue="mitigate" />
        </div>

        <FormField label="Justificacion del tratamiento" name="treatment_justification" type="textarea" />

        {error && (
          <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : 'Crear Riesgo'}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
