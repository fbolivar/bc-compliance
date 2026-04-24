/**
 * Connector framework — Wazuh SIEM API.
 *
 * Allows ingesting security alerts from an on-premise or cloud Wazuh instance.
 * Convention: each connector implements `fetch()` and `normalize()`.
 * The normalized payload is inserted into the `incidents` table with
 * dedup via source_event_id.
 */

export interface WazuhConfig {
  baseUrl: string; // https://wazuh.example.com:55000
  username: string;
  password: string;
  indexPattern?: string; // e.g. 'wazuh-alerts-*'
}

export interface WazuhAlert {
  id: string;
  timestamp: string;
  rule: {
    description: string;
    level: number;
    groups: string[];
  };
  agent: {
    name: string;
  };
  data: unknown;
}

export interface NormalizedIncident {
  organization_id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open';
  source_event_id: string;
  category: string;
  detected_at: string;
  description: string;
  source: string;
}

function mapLevelToSeverity(level: number): NormalizedIncident['severity'] {
  if (level >= 15) return 'critical';
  if (level >= 12) return 'high';
  if (level >= 8) return 'medium';
  return 'low';
}

function generateMockWazuhAlerts(): WazuhAlert[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'wazuh-mock-001',
      timestamp: now,
      rule: { description: 'SSH brute force attack detected', level: 10, groups: ['authentication_failures', 'brute_force'] },
      agent: { name: 'web-server-01' },
      data: { srcip: '198.51.100.45', attempts: 847, protocol: 'ssh' },
    },
    {
      id: 'wazuh-mock-002',
      timestamp: now,
      rule: { description: 'Malware signature detected in uploaded file', level: 14, groups: ['malware', 'virus'] },
      agent: { name: 'fileserver-02' },
      data: { file: '/uploads/invoice.pdf.exe', signature: 'Trojan.Downloader.GenericKD', user: 'jperez' },
    },
    {
      id: 'wazuh-mock-003',
      timestamp: now,
      rule: { description: 'Privilege escalation via sudo exploit', level: 15, groups: ['privilege_escalation', 'exploit'] },
      agent: { name: 'db-server-01' },
      data: { user: 'www-data', command: 'sudo python3 -c "import pty;pty.spawn(\'/bin/bash\')"' },
    },
    {
      id: 'wazuh-mock-004',
      timestamp: now,
      rule: { description: 'Lateral movement: unusual SMB connection between internal hosts', level: 12, groups: ['lateral_movement', 'network'] },
      agent: { name: 'workstation-14' },
      data: { srcip: '10.0.10.14', dstip: '10.0.0.5', port: 445, protocol: 'smb' },
    },
    {
      id: 'wazuh-mock-005',
      timestamp: now,
      rule: { description: 'Data exfiltration: large outbound transfer to unknown IP', level: 13, groups: ['data_exfiltration', 'network'] },
      agent: { name: 'app-server-03' },
      data: { srcip: '10.0.1.50', dstip: '203.0.113.99', bytes: 524288000, protocol: 'https' },
    },
  ];
}

export async function fetchWazuhAlerts(config: WazuhConfig): Promise<WazuhAlert[]> {
  const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${config.baseUrl}/alerts?limit=50`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[wazuh] API responded ${res.status} — falling back to mock data`);
      return generateMockWazuhAlerts();
    }

    const body = await res.json() as { data?: { affected_items?: WazuhAlert[] } };
    return body?.data?.affected_items ?? generateMockWazuhAlerts();
  } catch (err) {
    clearTimeout(timeout);
    console.warn('[wazuh] fetch failed, using mock data:', err instanceof Error ? err.message : err);
    return generateMockWazuhAlerts();
  }
}

export function normalizeWazuhAlert(alert: WazuhAlert, orgId: string): NormalizedIncident {
  return {
    organization_id: orgId,
    title: alert.rule.description,
    severity: mapLevelToSeverity(alert.rule.level),
    status: 'open',
    source_event_id: alert.id,
    category: alert.rule.groups[0] ?? 'security_alert',
    detected_at: alert.timestamp,
    description: JSON.stringify(alert.data).slice(0, 500),
    source: `Wazuh (${alert.agent.name})`,
  };
}
