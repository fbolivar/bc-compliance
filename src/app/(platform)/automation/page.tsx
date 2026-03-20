import { requireOrg } from '@/shared/lib/get-org';
import { getAutomationRules, getActiveRuleCount } from '@/features/automation/services/automationService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import Link from 'next/link';
import { Zap, Settings, ArrowRight } from 'lucide-react';

export default async function AutomationPage() {
  const { orgId } = await requireOrg();
  const [rulesResult, activeCount] = await Promise.all([
    getAutomationRules(orgId, { pageSize: 5 }),
    getActiveRuleCount(orgId),
  ]);

  const recentRules = rulesResult.data;
  const totalRules = rulesResult.count;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Motor de Automatizacion"
        description="Reglas SOAR-lite para respuesta automatica a eventos de compliance"
        actions={
          <Link
            href="/automation/rules"
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Gestionar Reglas
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <p className="text-xs text-sky-600 font-medium">Reglas Activas</p>
          <p className="text-4xl font-bold text-sky-600 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-400">Total Reglas</p>
          <p className="text-4xl font-bold text-slate-700 mt-1">{totalRules}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-400">Reglas Inactivas</p>
          <p className="text-4xl font-bold text-slate-400 mt-1">{totalRules - activeCount}</p>
        </div>
      </div>

      {/* Trigger types explained */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Tipos de Trigger Disponibles</h2>
          <div className="space-y-3">
            {[
              { type: 'schedule', desc: 'Ejecucion programada (cron)', icon: '⏰' },
              { type: 'event', desc: 'Respuesta a eventos del sistema', icon: '⚡' },
              { type: 'threshold', desc: 'Al superar un umbral definido', icon: '📊' },
              { type: 'webhook', desc: 'Llamada desde sistema externo', icon: '🔗' },
              { type: 'manual', desc: 'Ejecucion manual por usuario', icon: '👆' },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-700 capitalize">{item.type}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Acciones Disponibles</h2>
          <div className="space-y-3">
            {[
              { action: 'send_notification', desc: 'Notificacion en plataforma', icon: '🔔' },
              { action: 'send_email', desc: 'Correo electronico', icon: '📧' },
              { action: 'create_task', desc: 'Crear tarea de seguimiento', icon: '✅' },
              { action: 'create_incident', desc: 'Generar incidente automaticamente', icon: '🚨' },
              { action: 'generate_report', desc: 'Ejecutar generacion de reporte', icon: '📋' },
            ].map((item) => (
              <div key={item.action} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-700 capitalize">{item.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent rules */}
      {recentRules.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-500" />
              <h2 className="text-sm font-semibold text-slate-700">Reglas Recientes</h2>
            </div>
            <Link href="/automation/rules" className="text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentRules.map((rule) => (
              <div key={rule.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{rule.name}</p>
                    <p className="text-xs text-slate-500">
                      {rule.trigger_type} → {rule.action_type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <StatusBadge status={rule.is_active ? 'active' : 'inactive'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
