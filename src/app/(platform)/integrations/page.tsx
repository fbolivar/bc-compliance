import { requireOrg } from '@/shared/lib/get-org';
import { getConnectors } from '@/features/integrations/actions/connectorActions';
import { CONNECTOR_CATALOG } from '@/features/integrations/services/integrationService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { IntegrationCard, type ToolDef } from '@/features/integrations/components/IntegrationCard';

// Fully-wired tools with their own card UI
const WIRED_TOOLS: ToolDef[] = [
  {
    id: 'tenable',
    name: 'Tenable Nessus',
    description: 'Escáner de vulnerabilidades y gestión de exposición',
    type: 'vulnerability_scanner',
    icon: 'ShieldAlert',
    color: 'rose',
  },
  {
    id: 'wazuh',
    name: 'Wazuh SIEM',
    description: 'Detección de amenazas, análisis de logs y respuesta a incidentes',
    type: 'siem',
    icon: 'Activity',
    color: 'amber',
  },
];

// Catalog tools that are NOT yet fully wired — shown in the catalog section
const CATALOG_EXCLUDE_TYPES = new Set(['tenable', 'qualys']); // tenable handled above

export default async function IntegrationsPage() {
  await requireOrg();

  // Fetch existing connector rows (safe columns only — no auth_config)
  const connectors = await getConnectors();

  const connectorByType = new Map(connectors.map((c) => [c.integration_type, c]));

  // Build the connector catalog grouped by category, excluding wired tools
  const catalogTools = CONNECTOR_CATALOG.filter((c) => !CATALOG_EXCLUDE_TYPES.has(c.id));
  const byCategory = catalogTools.reduce<Record<string, typeof CONNECTOR_CATALOG>>((acc, connector) => {
    if (!acc[connector.category]) acc[connector.category] = [];
    acc[connector.category].push(connector);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hub de Integraciones"
        description="Conectores con SIEM, escáneres de vulnerabilidades, EDR y herramientas de ITSM"
      />

      {/* ── Wired integrations ─────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Integraciones activas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WIRED_TOOLS.map((tool) => {
            // Match by integration_type
            const integrationType = tool.id === 'tenable' ? 'vulnerability_scanner' : 'siem';
            const connector = connectorByType.get(integrationType);
            return (
              <IntegrationCard
                key={tool.id}
                tool={tool}
                connector={connector}
              />
            );
          })}
        </div>
      </section>

      {/* ── Active integrations summary ────────────────────── */}
      {connectors.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Resumen de conectores
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {connectors.map((connector) => (
                <div
                  key={connector.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{connector.name}</p>
                    <p className="text-xs text-slate-500">
                      {connector.last_sync_at
                        ? `Sync: ${new Date(connector.last_sync_at).toLocaleDateString('es-CO')}`
                        : 'Sin sincronización'}
                    </p>
                  </div>
                  <StatusBadge status={connector.status} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Connector catalog ──────────────────────────────── */}
      {Object.entries(byCategory).map(([category, catalogConnectors]) => (
        <section key={category}>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogConnectors.map((connector) => {
              const active = connectors.find((c) => c.name.toLowerCase().includes(connector.id.toLowerCase()));

              return (
                <div
                  key={connector.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{connector.icon}</span>
                    {connector.status === 'coming_soon' ? (
                      <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-400 border border-slate-200 rounded">
                        Próximamente
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
                    type="button"
                    disabled={connector.status === 'coming_soon'}
                    className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors ${
                      connector.status === 'coming_soon'
                        ? 'text-slate-400 border-slate-200 cursor-not-allowed'
                        : active
                          ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                          : 'text-sky-600 border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    {connector.status === 'coming_soon'
                      ? 'Próximamente'
                      : active
                        ? 'Configurar'
                        : 'Conectar'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
