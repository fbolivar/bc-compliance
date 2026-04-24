'use client';

import { useTransition, useState } from 'react';
import { ShieldAlert, Activity, Settings, RefreshCw, Wifi, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { runSyncAction, testIntegrationConnection, type ConnectorRow } from '@/features/integrations/actions/connectorActions';
import { IntegrationConfigModal } from './IntegrationConfigModal';

export interface ToolDef {
  id: 'tenable' | 'wazuh';
  name: string;
  description: string;
  type: string;
  icon: string;
  color: string;
}

interface IntegrationCardProps {
  tool: ToolDef;
  connector?: ConnectorRow;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  connected: { label: 'Conectado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  configuring: { label: 'Configurando', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  error: { label: 'Error', classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  syncing: { label: 'Sincronizando', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, classes: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${style.classes}`}>
      {style.label}
    </span>
  );
}

function ToolIcon({ id, color }: { id: 'tenable' | 'wazuh'; color: string }) {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const cls = colorMap[color] ?? 'bg-slate-100 text-slate-600';

  if (id === 'tenable') return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cls}`}>
      <ShieldAlert className="w-5 h-5" />
    </div>
  );
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cls}`}>
      <Activity className="w-5 h-5" />
    </div>
  );
}

export function IntegrationCard({ tool, connector }: IntegrationCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackOk, setFeedbackOk] = useState(true);

  const [syncing, startSyncTransition] = useTransition();
  const [testing, startTestTransition] = useTransition();

  const handleSync = () => {
    if (!connector) return;
    setFeedback(null);
    startSyncTransition(async () => {
      const res = await runSyncAction(connector.id);
      if (res.error) {
        setFeedback(`Error: ${res.error}`);
        setFeedbackOk(false);
        return;
      }
      const demoTag = res.demo ? ' (demo)' : '';
      setFeedback(`Sync OK${demoTag}: ${res.inserted ?? 0} nuevos, ${res.updated ?? 0} actualizados`);
      setFeedbackOk(true);
    });
  };

  const handleTest = () => {
    if (!connector) return;
    setFeedback(null);
    startTestTransition(async () => {
      const res = await testIntegrationConnection(connector.id);
      if (res.error) {
        setFeedback(`Fallo: ${res.error}${res.latencyMs ? ` (${res.latencyMs}ms)` : ''}`);
        setFeedbackOk(false);
        return;
      }
      setFeedback(`Conexión OK · ${res.latencyMs}ms`);
      setFeedbackOk(true);
    });
  };

  const isConfigured = !!connector;
  const status = connector?.status ?? 'not_configured';
  const isConnected = status === 'connected';
  const isBusy = syncing || testing;

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col">

        {/* Top row: icon + status badge */}
        <div className="flex items-start justify-between mb-4">
          <ToolIcon id={tool.id} color={tool.color} />
          {isConfigured ? (
            <StatusBadge status={status} />
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border bg-slate-50 text-slate-500 border-slate-200">
              No configurado
            </span>
          )}
        </div>

        {/* Name + description */}
        <h3 className="text-sm font-semibold text-slate-800 mb-1">{tool.name}</h3>
        <p className="text-xs text-slate-500 flex-1 mb-4">{tool.description}</p>

        {/* Last sync */}
        {connector?.last_sync_at && (
          <p className="flex items-center gap-1 text-xs text-slate-400 mb-3">
            <Clock className="w-3 h-3" />
            Último sync: {new Date(connector.last_sync_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}

        {/* Last error */}
        {status === 'error' && connector?.last_error && (
          <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-2">
            <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-700 leading-snug line-clamp-2">{connector.last_error}</p>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`mb-3 flex items-start gap-1.5 rounded-lg px-2.5 py-2 border ${feedbackOk ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            {feedbackOk
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
            }
            <p className={`text-xs leading-snug ${feedbackOk ? 'text-emerald-700' : 'text-rose-700'}`}>{feedback}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Configure button — always available */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            {isConfigured ? 'Editar configuración' : 'Configurar conector'}
          </button>

          {/* Test + Sync buttons — only when configured */}
          {isConfigured && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isBusy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {testing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Wifi className="w-3.5 h-3.5" />
                }
                Probar
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={isBusy || !isConnected}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />
                }
                Sincronizar
              </button>
            </div>
          )}

          {/* Hint for non-connected state */}
          {isConfigured && !isConnected && status !== 'error' && (
            <p className="text-xs text-center text-slate-400">
              Prueba la conexión primero para habilitar la sincronización
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <IntegrationConfigModal
          tool={tool.id}
          onClose={() => setShowModal(false)}
          existingEndpoint={connector?.endpoint_url ?? undefined}
        />
      )}
    </>
  );
}
