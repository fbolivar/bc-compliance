import { requireOrg } from '@/shared/lib/get-org';
import { getIntegrations, CONNECTOR_CATALOG } from '@/features/integrations/services/integrationService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';

export default async function IntegrationsPage() {
  const { orgId } = await requireOrg();
  const integrationsResult = await getIntegrations(orgId);
  const activeIntegrations = integrationsResult.data;

  const activeByType = new Map(activeIntegrations.map((i) => [i.integration_type, i]));

  const byCategory = CONNECTOR_CATALOG.reduce<Record<string, typeof CONNECTOR_CATALOG>>((acc, connector) => {
    if (!acc[connector.category]) acc[connector.category] = [];
    acc[connector.category].push(connector);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hub de Integraciones"
        description="Conectores con SIEM, escáneres de vulnerabilidades, EDR y herramientas de ITSM"
      />

      {/* Active integrations summary */}
      {activeIntegrations.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Integraciones Activas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{integration.name}</p>
                  <p className="text-xs text-slate-500">
                    {integration.last_sync_at
                      ? `Sync: ${new Date(integration.last_sync_at).toLocaleDateString('es-CO')}`
                      : 'Sin sincronizacion'}
                  </p>
                </div>
                <StatusBadge status={integration.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connector catalog by category */}
      {Object.entries(byCategory).map(([category, connectors]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((connector) => {
              const active = activeByType.get(connector.id);

              return (
                <div
                  key={connector.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{connector.icon}</span>
                    {connector.status === 'coming_soon' ? (
                      <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-400 border border-slate-200 rounded">
                        Proximamente
                      </span>
                    ) : active ? (
                      <StatusBadge status={active.status} />
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded">
                        Disponible
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">{connector.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{connector.description}</p>
                  <button
                    disabled={connector.status === 'coming_soon'}
                    className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors ${
                      connector.status === 'coming_soon'
                        ? 'text-slate-400 border-slate-200 cursor-not-allowed'
                        : active
                          ? 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                          : 'text-sky-500 border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    {connector.status === 'coming_soon'
                      ? 'Proximamente'
                      : active
                        ? 'Configurar'
                        : 'Conectar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
