'use client';

import { useTransition, useState } from 'react';
import { X, Loader2, ShieldAlert, Activity } from 'lucide-react';
import { saveIntegrationConfig } from '@/features/integrations/actions/connectorActions';

interface IntegrationConfigModalProps {
  tool: 'tenable' | 'wazuh';
  onClose: () => void;
  existingEndpoint?: string;
}

const TOOL_META = {
  tenable: {
    label: 'Tenable Nessus',
    icon: ShieldAlert,
    color: 'rose',
    description: 'Conecta tu instancia de Tenable Nessus para importar vulnerabilidades automáticamente.',
  },
  wazuh: {
    label: 'Wazuh SIEM',
    icon: Activity,
    color: 'amber',
    description: 'Conecta tu instancia Wazuh para ingestar alertas de seguridad como incidentes.',
  },
} as const;

export function IntegrationConfigModal({ tool, onClose, existingEndpoint }: IntegrationConfigModalProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const meta = TOOL_META[tool];
  const Icon = meta.icon;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await saveIntegrationConfig(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  };

  return (
    /* Dark overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div className="w-full sm:max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-slate-300/30 overflow-hidden max-h-[90vh] sm:max-h-[85vh] sm:mx-4 flex flex-col">

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-300 rounded-full sm:hidden" />
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <Icon className={`w-5 h-5 ${tool === 'tenable' ? 'text-rose-600' : 'text-amber-600'}`} />
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              Configurar {meta.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
          <p className="text-sm text-slate-500 mb-5">{meta.description}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden tool type */}
            <input type="hidden" name="tool_type" value={tool} />

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del conector
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={meta.label}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
              />
            </div>

            {/* Endpoint URL */}
            <div>
              <label htmlFor="endpoint_url" className="block text-sm font-medium text-slate-700 mb-1">
                URL del endpoint
              </label>
              <input
                id="endpoint_url"
                name="endpoint_url"
                type="url"
                required
                defaultValue={existingEndpoint ?? ''}
                placeholder={
                  tool === 'tenable'
                    ? 'https://nessus.ejemplo.com:8834'
                    : 'https://wazuh.ejemplo.com:55000'
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
              />
            </div>

            {/* Tool-specific fields */}
            {tool === 'tenable' && (
              <>
                <div>
                  <label htmlFor="accessKey" className="block text-sm font-medium text-slate-700 mb-1">
                    Access Key
                  </label>
                  <input
                    id="accessKey"
                    name="accessKey"
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="Tu Tenable Access Key"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="secretKey" className="block text-sm font-medium text-slate-700 mb-1">
                    Secret Key
                  </label>
                  <input
                    id="secretKey"
                    name="secretKey"
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="Tu Tenable Secret Key"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="scanIds" className="block text-sm font-medium text-slate-700 mb-1">
                    IDs de Scans <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="scanIds"
                    name="scanIds"
                    type="text"
                    placeholder="1,2,3"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Dejar vacío para sincronizar todos los scans completados</p>
                </div>
              </>
            )}

            {tool === 'wazuh' && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                    Usuario
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="wazuh-api-user"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="indexPattern" className="block text-sm font-medium text-slate-700 mb-1">
                    Index Pattern <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="indexPattern"
                    name="indexPattern"
                    type="text"
                    placeholder="wazuh-alerts-*"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-60 transition-colors"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {pending ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
