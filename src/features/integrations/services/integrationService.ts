import { paginatedQuery, getById } from '@/shared/lib/service-helpers';
import type { PaginationParams, PaginatedResult } from '@/shared/lib/service-helpers';

export interface IntegrationRow {
  id: string;
  organization_id: string;
  name: string;
  integration_type: string;
  provider: string | null;
  status: string;
  config: Record<string, unknown> | null;
  last_sync_at: string | null;
  sync_frequency: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const CONNECTOR_CATALOG = [
  {
    id: 'microsoft-sentinel',
    name: 'Microsoft Sentinel',
    category: 'SIEM',
    description: 'Integracion con Azure Sentinel para correlacion de eventos de seguridad',
    icon: '🔷',
    status: 'available',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    category: 'SIEM',
    description: 'Conectar con Splunk para analisis de logs y eventos',
    icon: '🟢',
    status: 'available',
  },
  {
    id: 'tenable',
    name: 'Tenable.io',
    category: 'Vulnerability Scanner',
    description: 'Importar resultados de escaneos de vulnerabilidades',
    icon: '🔍',
    status: 'available',
  },
  {
    id: 'qualys',
    name: 'Qualys',
    category: 'Vulnerability Scanner',
    description: 'Sincronizar vulnerabilidades y activos desde Qualys',
    icon: '🛡️',
    status: 'available',
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'Issue Tracker',
    description: 'Crear y gestionar tickets en Jira desde hallazgos de compliance',
    icon: '🎯',
    status: 'available',
  },
  {
    id: 'servicenow',
    name: 'ServiceNow',
    category: 'ITSM',
    description: 'Integracion bidireccional con ServiceNow GRC',
    icon: '⚙️',
    status: 'coming_soon',
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    category: 'EDR',
    description: 'Importar alertas e incidentes desde Falcon',
    icon: '🦅',
    status: 'available',
  },
  {
    id: 'aws-security-hub',
    name: 'AWS Security Hub',
    category: 'Cloud Security',
    description: 'Centralizar hallazgos de seguridad de AWS',
    icon: '☁️',
    status: 'available',
  },
  {
    id: 'google-chronicle',
    name: 'Google Chronicle',
    category: 'SIEM',
    description: 'Integracion con Chronicle SIEM para deteccion de amenazas',
    icon: '🔵',
    status: 'coming_soon',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Notifications',
    description: 'Recibir alertas y notificaciones de compliance en Slack',
    icon: '💬',
    status: 'available',
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'Notifications',
    description: 'Notificaciones y alertas via Microsoft Teams',
    icon: '💼',
    status: 'available',
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    category: 'Incident Management',
    description: 'Escalar incidentes criticos a PagerDuty',
    icon: '🚨',
    status: 'available',
  },
];

export async function getIntegrations(
  orgId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<IntegrationRow>> {
  return paginatedQuery<IntegrationRow>('integrations', orgId, params);
}

export async function getIntegrationById(id: string): Promise<IntegrationRow | null> {
  return getById<IntegrationRow>('integrations', id);
}
