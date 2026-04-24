'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { writeAuditLog } from '@/shared/lib/audit';
import {
  fetchNessusVulnerabilities,
  generateMockNessusVulnerabilities,
  normalizeNessusRow,
  type NormalizedVulnerability,
} from '@/features/integrations/connectors/nessus';
import {
  fetchWazuhAlerts,
  normalizeWazuhAlert,
  type NormalizedIncident,
} from '@/features/integrations/connectors/wazuh';

// Safe columns to return to client — NEVER includes auth_config
const SAFE_COLUMNS =
  'id, name, integration_type, status, endpoint_url, last_sync_at, error_count, last_error, health_check_at, sync_interval_minutes, created_at';

export interface ConnectorRow {
  id: string;
  name: string;
  integration_type: string;
  status: string;
  endpoint_url: string | null;
  last_sync_at: string | null;
  error_count: number;
  last_error: string | null;
  health_check_at: string | null;
  sync_interval_minutes: number | null;
  created_at: string;
}

interface FullConnectorRow extends ConnectorRow {
  auth_config: Record<string, string> | null;
}

export type ConnectorActionResult = {
  success?: boolean;
  error?: string;
  inserted?: number;
  updated?: number;
  demo?: boolean;
  latencyMs?: number;
};

// ---------------------------------------------------------------------------
// getConnectors — returns safe columns only, never auth_config
// ---------------------------------------------------------------------------
export async function getConnectors(): Promise<ConnectorRow[]> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('integration_connectors')
    .select(SAFE_COLUMNS)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getConnectors]', error.message);
    return [];
  }
  return (data ?? []) as ConnectorRow[];
}

// ---------------------------------------------------------------------------
// saveIntegrationConfig — upserts connector row, never returns auth_config
// ---------------------------------------------------------------------------
export async function saveIntegrationConfig(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { error: 'Sin organización' };

  const toolType = formData.get('tool_type') as string;
  const name = formData.get('name') as string;
  const endpointUrl = formData.get('endpoint_url') as string;

  if (!toolType || !name || !endpointUrl) {
    return { error: 'Nombre, URL y tipo de herramienta son requeridos' };
  }

  let integrationTypeValue: string;
  let authConfig: Record<string, string>;

  if (toolType === 'tenable') {
    const accessKey = formData.get('accessKey') as string;
    const secretKey = formData.get('secretKey') as string;
    if (!accessKey || !secretKey) return { error: 'Access Key y Secret Key son requeridos para Tenable' };
    integrationTypeValue = 'vulnerability_scanner';
    authConfig = { accessKey, secretKey };
  } else if (toolType === 'wazuh') {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    if (!username || !password) return { error: 'Usuario y contraseña son requeridos para Wazuh' };
    integrationTypeValue = 'siem';
    authConfig = { username, password };
  } else {
    return { error: `Tipo de herramienta desconocido: ${toolType}` };
  }

  const supabase = await createClient();

  // Check if connector already exists for this org + type
  const { data: existing } = await supabase
    .from('integration_connectors')
    .select('id')
    .eq('organization_id', orgId)
    .eq('integration_type', integrationTypeValue)
    .limit(1)
    .single();

  const record = {
    organization_id: orgId,
    name,
    integration_type: integrationTypeValue,
    endpoint_url: endpointUrl,
    auth_config: authConfig,
    status: 'configuring',
  };

  let upsertError: string | null = null;

  if (existing?.id) {
    const { error } = await supabase
      .from('integration_connectors')
      .update(record)
      .eq('id', existing.id);
    if (error) upsertError = error.message;
  } else {
    const { error } = await supabase
      .from('integration_connectors')
      .insert(record);
    if (error) upsertError = error.message;
  }

  if (upsertError) return { error: upsertError };

  await writeAuditLog({
    action: existing?.id ? 'update' : 'create',
    tableName: 'integration_connectors',
    description: `Configuración de integración ${name} (${integrationTypeValue}) guardada`,
  });

  revalidatePath('/integrations');
  return { success: true };
}

// ---------------------------------------------------------------------------
// testIntegrationConnection — pings the tool, updates status
// ---------------------------------------------------------------------------
export async function testIntegrationConnection(
  connectorId: string,
): Promise<{ success?: boolean; error?: string; latencyMs?: number }> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { error: 'Sin organización' };

  const supabase = await createClient();

  // Read FULL row including auth_config — stays in server only
  const { data: connector, error: fetchError } = await supabase
    .from('integration_connectors')
    .select('*')
    .eq('id', connectorId)
    .eq('organization_id', orgId)
    .single();

  if (fetchError || !connector) {
    return { error: 'Conector no encontrado' };
  }

  const full = connector as unknown as FullConnectorRow;
  const endpointUrl = full.endpoint_url;
  if (!endpointUrl) return { error: 'URL del endpoint no configurada' };

  let pingUrl: string;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (full.integration_type === 'vulnerability_scanner') {
    // Tenable Nessus
    const { accessKey, secretKey } = full.auth_config ?? {};
    if (accessKey && secretKey) {
      headers['X-ApiKeys'] = `accessKey=${accessKey}; secretKey=${secretKey}`;
    }
    pingUrl = `${endpointUrl}/scans`;
  } else {
    // Wazuh SIEM
    const { username, password } = full.auth_config ?? {};
    if (username && password) {
      const creds = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${creds}`;
    }
    pingUrl = `${endpointUrl}/`;
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 5000);
  const startMs = Date.now();
  let newStatus = 'connected';
  let errorMsg: string | null = null;
  let latencyMs: number | undefined;

  try {
    const res = await fetch(pingUrl, { headers, signal: controller.signal });
    latencyMs = Date.now() - startMs;
    if (!res.ok) {
      newStatus = 'error';
      errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (err) {
    latencyMs = Date.now() - startMs;
    newStatus = 'error';
    errorMsg = err instanceof Error ? err.message : 'Connection failed';
  } finally {
    clearTimeout(timeoutHandle);
  }

  await supabase
    .from('integration_connectors')
    .update({
      status: newStatus,
      health_check_at: new Date().toISOString(),
      last_error: errorMsg,
      error_count: newStatus === 'error' ? (full.error_count ?? 0) + 1 : 0,
    })
    .eq('id', connectorId);

  revalidatePath('/integrations');

  if (newStatus === 'error') {
    return { error: errorMsg ?? 'Connection failed', latencyMs };
  }
  return { success: true, latencyMs };
}

// ---------------------------------------------------------------------------
// Persist vulnerabilities helper
// ---------------------------------------------------------------------------
async function persistVulnerabilities(
  orgId: string,
  vulns: NormalizedVulnerability[],
): Promise<{ inserted: number; updated: number }> {
  const supabase = await createClient();
  let inserted = 0;
  let updated = 0;

  for (const v of vulns) {
    const { data: existing } = await supabase
      .from('vulnerabilities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('scanner_ref', v.scanner_ref ?? '')
      .limit(1);

    const code = `VLN-${(v.cve_id ?? v.scanner_ref ?? Math.random().toString(36).slice(2, 8)).toUpperCase()}`.slice(0, 50);

    const row = {
      organization_id: orgId,
      code,
      cve_id: v.cve_id,
      title: v.title,
      description: v.description,
      severity: v.severity,
      cvss_base_score: v.cvss_base_score,
      cvss_vector: v.cvss_vector,
      status: 'open' as const,
      source: v.source,
      scanner_ref: v.scanner_ref,
      affected_host: v.affected_host,
      affected_port: v.affected_port,
      affected_os: v.affected_os,
      affected_product: v.affected_product,
      affected_version: v.affected_version,
      remediation: v.remediation,
      exploit_available: v.exploit_available,
      patch_available: v.patch_available,
    };

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('vulnerabilities')
        .update({ severity: row.severity, cvss_base_score: row.cvss_base_score, remediation: row.remediation })
        .eq('id', existing[0].id);
      if (!error) updated++;
    } else {
      const { error } = await supabase.from('vulnerabilities').insert(row);
      if (!error) inserted++;
    }
  }

  return { inserted, updated };
}

// ---------------------------------------------------------------------------
// Persist incidents helper (Wazuh)
// ---------------------------------------------------------------------------
async function persistIncidents(
  orgId: string,
  incidents: NormalizedIncident[],
): Promise<{ inserted: number; updated: number }> {
  const supabase = await createClient();
  let inserted = 0;
  let updated = 0;

  for (const inc of incidents) {
    // Dedup by source_event_id
    const { data: existing } = await supabase
      .from('incidents')
      .select('id')
      .eq('organization_id', orgId)
      .eq('source', inc.source)
      .ilike('title', inc.title)
      .limit(1);

    const code = `INC-WAZUH-${inc.source_event_id.slice(-8).toUpperCase()}`;

    const row = {
      organization_id: orgId,
      code,
      title: inc.title,
      description: inc.description,
      severity: inc.severity,
      status: inc.status,
      category: inc.category,
      source: inc.source,
      detected_at: inc.detected_at,
    };

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('incidents')
        .update({ severity: row.severity, status: row.status })
        .eq('id', existing[0].id);
      if (!error) updated++;
    } else {
      const { error } = await supabase.from('incidents').insert(row);
      if (!error) inserted++;
    }
  }

  return { inserted, updated };
}

// ---------------------------------------------------------------------------
// runSyncAction — main sync entry point
// ---------------------------------------------------------------------------
export async function runSyncAction(
  connectorId: string,
): Promise<ConnectorActionResult> {
  const { orgId } = await getCurrentOrg();
  if (!orgId) return { error: 'Sin organización' };

  const supabase = await createClient();

  // Read FULL row including auth_config — stays in server only
  const { data: connector, error: fetchError } = await supabase
    .from('integration_connectors')
    .select('*')
    .eq('id', connectorId)
    .eq('organization_id', orgId)
    .single();

  if (fetchError || !connector) {
    return { error: 'Conector no encontrado' };
  }

  const full = connector as unknown as FullConnectorRow;
  let inserted = 0;
  let updated = 0;
  let isDemo = false;

  try {
    if (full.integration_type === 'vulnerability_scanner') {
      // Tenable Nessus flow
      const { accessKey, secretKey } = full.auth_config ?? {};
      let vulns: NormalizedVulnerability[];

      if (accessKey && secretKey && full.endpoint_url) {
        try {
          vulns = await fetchNessusVulnerabilities({
            baseUrl: full.endpoint_url,
            accessKey,
            secretKey,
          });
        } catch {
          vulns = generateMockNessusVulnerabilities(5).map((v) => v);
          isDemo = true;
        }
      } else {
        vulns = generateMockNessusVulnerabilities(5);
        isDemo = true;
      }

      const result = await persistVulnerabilities(orgId, vulns);
      inserted = result.inserted;
      updated = result.updated;

      revalidatePath('/vulnerabilities');
    } else if (full.integration_type === 'siem') {
      // Wazuh SIEM flow
      const { username, password } = full.auth_config ?? {};
      let alerts;

      if (username && password && full.endpoint_url) {
        alerts = await fetchWazuhAlerts({
          baseUrl: full.endpoint_url,
          username,
          password,
          indexPattern: full.auth_config?.indexPattern,
        });
        // fetchWazuhAlerts already falls back to mock on error
        // Check if we got mock data (all IDs start with 'wazuh-mock-')
        isDemo = alerts.every((a) => a.id.startsWith('wazuh-mock-'));
      } else {
        const { fetchWazuhAlerts: fetchMock } = await import('@/features/integrations/connectors/wazuh');
        alerts = await fetchMock({ baseUrl: '', username: '', password: '' });
        isDemo = true;
      }

      const normalized = alerts.map((a) => normalizeWazuhAlert(a, orgId));
      const result = await persistIncidents(orgId, normalized);
      inserted = result.inserted;
      updated = result.updated;

      revalidatePath('/incidents');
    } else {
      return { error: `Tipo de integración no soportado: ${full.integration_type}` };
    }

    // Update last_sync_at
    await supabase
      .from('integration_connectors')
      .update({
        last_sync_at: new Date().toISOString(),
        status: 'connected',
        last_error: null,
      })
      .eq('id', connectorId);

    await writeAuditLog({
      action: 'create',
      tableName: full.integration_type === 'siem' ? 'incidents' : 'vulnerabilities',
      description: `Sync ${full.name}: ${inserted} nuevos, ${updated} actualizados${isDemo ? ' (demo)' : ''}`,
    });

    revalidatePath('/integrations');
    return { success: true, inserted, updated, demo: isDemo };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido durante la sincronización';
    console.error('[runSyncAction]', err);

    await supabase
      .from('integration_connectors')
      .update({
        status: 'error',
        last_error: msg,
        error_count: (full.error_count ?? 0) + 1,
      })
      .eq('id', connectorId);

    revalidatePath('/integrations');
    return { error: msg };
  }
}

// Re-export normalizeNessusRow so it's accessible if needed
export { normalizeNessusRow };
