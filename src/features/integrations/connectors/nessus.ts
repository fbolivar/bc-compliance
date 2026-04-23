/**
 * Connector framework — Tenable Nessus / Nessus Professional API.
 *
 * Permite ingestar vulnerabilidades desde un Nessus on-premise o cloud.
 * Convención: cada connector implementa `fetch()` y `normalize()`.
 * El payload normalizado se inserta en la tabla `vulnerabilities` con
 * dedup vía CVE/cve_id + affected_host.
 */

export interface NessusConfig {
  baseUrl: string; // https://nessus.example.com:8834
  accessKey: string;
  secretKey: string;
  scanIds?: number[]; // Specific scans to ingest, or all if empty
}

export interface NormalizedVulnerability {
  external_id: string;
  cve_id: string | null;
  title: string;
  description: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  cvss_base_score: number | null;
  cvss_vector: string | null;
  affected_host: string | null;
  affected_port: string | null;
  affected_os: string | null;
  affected_product: string | null;
  affected_version: string | null;
  remediation: string | null;
  source: string;
  scanner_ref: string | null;
  exploit_available: boolean;
  patch_available: boolean;
}

interface NessusVulnRow {
  pluginID?: number;
  plugin_name?: string;
  description?: string;
  severity?: number;
  cvss_base_score?: number;
  cvss_vector?: string;
  cve?: string[];
  hostname?: string;
  port?: number;
  protocol?: string;
  solution?: string;
  exploit_available?: boolean;
  exploited_by_malware?: boolean;
  patch_publication_date?: string;
  operating_system?: string;
  product?: string;
  version?: string;
}

const SEVERITY_MAP: Record<number, NormalizedVulnerability['severity']> = {
  4: 'critical',
  3: 'high',
  2: 'medium',
  1: 'low',
  0: 'informational',
};

export async function fetchNessusVulnerabilities(config: NessusConfig): Promise<NormalizedVulnerability[]> {
  const headers = {
    'X-ApiKeys': `accessKey=${config.accessKey}; secretKey=${config.secretKey}`,
    'Accept': 'application/json',
  };

  // Discover scans
  let scanIds = config.scanIds ?? [];
  if (scanIds.length === 0) {
    const res = await fetch(`${config.baseUrl}/scans`, { headers });
    if (!res.ok) throw new Error(`Nessus scans fetch failed: ${res.status} ${res.statusText}`);
    const data = await res.json() as { scans?: Array<{ id: number; status: string }> };
    scanIds = (data.scans ?? [])
      .filter((s) => s.status === 'completed')
      .map((s) => s.id);
  }

  const results: NormalizedVulnerability[] = [];

  for (const scanId of scanIds) {
    const res = await fetch(`${config.baseUrl}/scans/${scanId}`, { headers });
    if (!res.ok) {
      console.warn(`[nessus] scan ${scanId} fetch failed: ${res.status}`);
      continue;
    }
    const detail = await res.json() as { vulnerabilities?: NessusVulnRow[]; hosts?: Array<{ hostname?: string }> };
    for (const v of detail.vulnerabilities ?? []) {
      results.push(normalizeNessusRow(v, scanId));
    }
  }

  return results;
}

export function normalizeNessusRow(row: NessusVulnRow, scanId: number): NormalizedVulnerability {
  const cve = (row.cve && row.cve.length > 0) ? row.cve[0] : null;
  return {
    external_id: `nessus-${scanId}-${row.pluginID ?? 'unknown'}-${row.hostname ?? 'host'}`,
    cve_id: cve,
    title: row.plugin_name ?? cve ?? `Plugin ${row.pluginID}`,
    description: row.description ?? null,
    severity: SEVERITY_MAP[row.severity ?? 0] ?? 'informational',
    cvss_base_score: row.cvss_base_score ?? null,
    cvss_vector: row.cvss_vector ?? null,
    affected_host: row.hostname ?? null,
    affected_port: row.port ? `${row.port}/${row.protocol ?? 'tcp'}` : null,
    affected_os: row.operating_system ?? null,
    affected_product: row.product ?? null,
    affected_version: row.version ?? null,
    remediation: row.solution ?? null,
    source: 'Tenable Nessus',
    scanner_ref: row.pluginID ? String(row.pluginID) : null,
    exploit_available: row.exploit_available === true || row.exploited_by_malware === true,
    patch_available: !!row.patch_publication_date,
  };
}

/**
 * Para tests/demos sin Nessus real: genera vulns sintéticas realistas.
 */
export function generateMockNessusVulnerabilities(count = 5): NormalizedVulnerability[] {
  const samples: Partial<NormalizedVulnerability>[] = [
    {
      cve_id: 'CVE-2024-0204', title: 'Fortra GoAnywhere MFT Authentication Bypass',
      severity: 'critical', cvss_base_score: 9.8,
      affected_host: '10.0.5.10', affected_port: '8000/tcp',
      affected_product: 'Fortra GoAnywhere MFT', affected_version: '7.4.0',
      remediation: 'Actualizar a GoAnywhere MFT 7.4.1 o superior',
    },
    {
      cve_id: 'CVE-2023-46805', title: 'Ivanti Connect Secure Auth Bypass',
      severity: 'high', cvss_base_score: 8.2,
      affected_host: '10.0.5.4', affected_port: '443/tcp',
      affected_product: 'Ivanti Connect Secure', affected_version: '22.5R1',
      remediation: 'Aplicar parche XML workaround y desplegar 22.6R1.1+',
    },
    {
      cve_id: 'CVE-2024-21887', title: 'Ivanti Connect Secure Command Injection',
      severity: 'critical', cvss_base_score: 9.1,
      affected_host: '10.0.5.4', affected_port: '443/tcp',
      affected_product: 'Ivanti Connect Secure', affected_version: '22.5R1',
      remediation: 'Aplicar parche urgente — encadenable con CVE-2023-46805',
    },
    {
      cve_id: 'CVE-2024-3400', title: 'Palo Alto PAN-OS GlobalProtect RCE',
      severity: 'critical', cvss_base_score: 10.0,
      affected_host: '192.168.1.1', affected_port: '443/tcp',
      affected_product: 'PAN-OS', affected_version: '11.1.0',
      remediation: 'Aplicar hotfix de Palo Alto inmediatamente',
    },
    {
      cve_id: null, title: 'SMBv1 enabled on Windows Server',
      severity: 'medium', cvss_base_score: 5.9,
      affected_host: '192.168.10.50', affected_port: '445/tcp',
      affected_product: 'Windows Server 2019', affected_version: '10.0',
      remediation: 'Deshabilitar SMBv1 vía GPO',
    },
  ];

  const now = Date.now();
  return samples.slice(0, count).map((s, i) => ({
    external_id: `mock-nessus-${now}-${i}`,
    cve_id: s.cve_id ?? null,
    title: s.title!,
    description: `Detectado por escaneo Nessus simulado el ${new Date().toLocaleDateString('es-CO')}`,
    severity: s.severity!,
    cvss_base_score: s.cvss_base_score ?? null,
    cvss_vector: null,
    affected_host: s.affected_host!,
    affected_port: s.affected_port!,
    affected_os: null,
    affected_product: s.affected_product!,
    affected_version: s.affected_version!,
    remediation: s.remediation!,
    source: 'Tenable Nessus (mock)',
    scanner_ref: `MOCK-${i + 1}`,
    exploit_available: s.severity === 'critical',
    patch_available: true,
  }));
}
