'use client';

import { useState } from 'react';
import { sendInvitation } from '@/actions/invitations';
import { FormModal } from '@/shared/components/FormModal';
import { Mail, Send } from 'lucide-react';

interface InviteUserFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const roles = [
  { value: 'viewer', label: 'Visor', desc: 'Solo lectura' },
  { value: 'auditor', label: 'Auditor', desc: 'Lectura + auditorias' },
  { value: 'risk_analyst', label: 'Analista de Riesgos', desc: 'Gestion de riesgos y controles' },
  { value: 'compliance_manager', label: 'Compliance Manager', desc: 'Gestion completa de cumplimiento' },
  { value: 'admin', label: 'Administrador', desc: 'Acceso total excepto facturacion' },
];

export function InviteUserForm({ isOpen, onClose }: InviteUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await sendInvitation(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Invitar Usuario">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
            Invitacion enviada exitosamente
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email del invitado
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="email"
              required
              placeholder="usuario@empresa.com"
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Rol
          </label>
          <div className="space-y-2">
            {roles.map(role => (
              <label
                key={role.value}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors has-[:checked]:border-cyan-500/50 has-[:checked]:bg-cyan-500/5"
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  defaultChecked={role.value === 'viewer'}
                  className="mt-0.5 accent-cyan-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">{role.label}</p>
                  <p className="text-xs text-slate-500">{role.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Mensaje (opcional)
          </label>
          <textarea
            name="message"
            rows={2}
            placeholder="Bienvenido al equipo..."
            className="w-full px-4 py-2.5 sm:py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {success ? 'Enviada' : 'Enviar invitacion'}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
