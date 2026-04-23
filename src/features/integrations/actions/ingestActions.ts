'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserOrgId } from '@/shared/lib/actions-helpers';
import { writeAuditLog } from '@/shared/lib/audit';
import {
  fetchNessusVulnerabilities,
  generateMockNessusVulnerabilities,
  type NessusConfig,
  type NormalizedVulnerability,
} from '@/features/integrations/connectors/nessus';

export type ActionResult = {
  success?: boolean;
  error?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
};

async function persistVulnerabilities(
  orgId: string,
  vulns: NormalizedVulnerability[],
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const supabase = await createClient();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const v of vulns) {
    // Dedup: por external_id en metadata, o por (cve_id + affected_host) si hay CVE
    const dedupQuery = supabase
      .from('vulnerabilities')
      .select('id')
      .eq('organization_id', orgId);

    const { data: existing } = v.cve_id
      ? await dedupQuery.eq('cve_id', v.cve_id).eq('affected_host', v.affected_host ?? '').limit(1)
      : await dedupQuery.eq('scanner_ref', v.scanner_ref ?? '').limit(1);

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
        .update({
          severity: row.severity, cvss_base_score: row.cvss_base_score,
          remediation: row.remediation, exploit_available: row.exploit_available,
          patch_available: row.patch_available,
        })
        .eq('id', existing[0].id);
      if (!error) updated++;
      else skipped++;
    } else {
      const { error } = await supabase.from('vulnerabilities').insert(row);
      if (!error) inserted++;
      else skipped++;
    }
  }

  return { inserted, updated, skipped };
}

/**
 * Ingesta sintética para demo/testing — genera 5 vulnerabilidades realistas
 * sin necesidad de un Nessus real.
 */
export async function runMockIngest(): Promise<ActionResult> {
  try {
    const orgId = await getUserOrgId();
    if (!orgId) return { error: 'Sin organización' };

    const vulns = generateMockNessusVulnerabilities(5);
    const result = await persistVulnerabilities(orgId, vulns);

    await writeAuditLog({
      action: 'create',
      tableName: 'vulnerabilities',
      description: `Ingesta mock Nessus: ${result.inserted} nuevas, ${result.updated} actualizadas`,
    });

    revalidatePath('/vulnerabilities');
    return { success: true, ...result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[runMockIngest]', err);
    return { error: msg };
  }
}

export async function runNessusIngest(config: NessusConfig): Promise<ActionResult> {
  try {
    const orgId = await getUserOrgId();
    if (!orgId) return { error: 'Sin organización' };

    if (!config.baseUrl || !config.accessKey || !config.secretKey) {
      return { error: 'Configuración Nessus incompleta (baseUrl, accessKey, secretKey)' };
    }

    const vulns = await fetchNessusVulnerabilities(config);
    const result = await persistVulnerabilities(orgId, vulns);

    await writeAuditLog({
      action: 'create',
      tableName: 'vulnerabilities',
      description: `Ingesta Nessus: ${result.inserted} nuevas, ${result.updated} actualizadas`,
    });

    revalidatePath('/vulnerabilities');
    return { success: true, ...result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[runNessusIngest]', err);
    return { error: msg };
  }
}
