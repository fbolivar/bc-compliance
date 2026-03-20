import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/shared/lib/audit';

// Allow up to 50MB uploads (Vercel Pro limit)
export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60; // 60 seconds timeout for large files

interface ParsedVuln {
  name: string;
  description: string | null;
  severity: string;
  cvss_score: number | null;
  cve_id: string | null;
  discovery_date: string | null;
}

// Map Nessus severity to our enum
function mapNessusSeverity(level: string | number): string {
  const num = typeof level === 'string' ? parseInt(level) : level;
  switch (num) {
    case 4: return 'critical';
    case 3: return 'high';
    case 2: return 'medium';
    case 1: return 'low';
    default: return 'informational';
  }
}

// Map CVSS score to severity
function cvssToSeverity(score: number): string {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'informational';
}

// Parse .nessus XML format
function parseNessus(xmlContent: string): ParsedVuln[] {
  const vulns: ParsedVuln[] = [];

  // Simple XML parsing without external dependencies
  // Match each ReportItem block
  const reportItems = xmlContent.match(/<ReportItem[^>]*>[\s\S]*?<\/ReportItem>/g) || [];

  for (const item of reportItems) {
    // Extract attributes from ReportItem tag
    const severityMatch = item.match(/severity="(\d+)"/);
    const pluginNameMatch = item.match(/pluginName="([^"]*?)"/);

    // Skip informational (severity 0) unless they have CVEs
    const severity = severityMatch ? parseInt(severityMatch[1]) : 0;

    // Extract child elements
    const getElement = (tag: string): string | null => {
      const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return match ? match[1].trim() : null;
    };

    const pluginName = pluginNameMatch ? pluginNameMatch[1] : getElement('plugin_name') || 'Unknown';
    const description = getElement('description') || getElement('synopsis');
    const cvssScore = getElement('cvss3_base_score') || getElement('cvss_base_score');
    const cve = getElement('cve');

    // Skip pure informational with no CVE
    if (severity === 0 && !cve) continue;

    vulns.push({
      name: pluginName.substring(0, 500),
      description: description ? description.substring(0, 2000) : null,
      severity: mapNessusSeverity(severity),
      cvss_score: cvssScore ? parseFloat(cvssScore) : null,
      cve_id: cve || null,
      discovery_date: new Date().toISOString().split('T')[0],
    });
  }

  // Deduplicate by name+cve
  const seen = new Set<string>();
  return vulns.filter(v => {
    const key = `${v.name}|${v.cve_id || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Parse CSV format
// Expected headers: name,description,severity,cvss_score,cve_id,discovery_date
function parseCSV(content: string): ParsedVuln[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    // Handle quoted CSV values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += char;
    }
    values.push(current.trim());

    const get = (field: string) => {
      const idx = headers.indexOf(field);
      return idx >= 0 && values[idx] ? values[idx] : null;
    };

    const cvss = get('cvss_score') || get('cvss');
    const severity = get('severity') || (cvss ? cvssToSeverity(parseFloat(cvss)) : 'medium');

    return {
      name: get('name') || get('title') || get('plugin_name') || 'Sin nombre',
      description: get('description') || get('synopsis') || null,
      severity: severity.toLowerCase(),
      cvss_score: cvss ? parseFloat(cvss) : null,
      cve_id: get('cve_id') || get('cve') || null,
      discovery_date: get('discovery_date') || get('date') || new Date().toISOString().split('T')[0],
    };
  }).filter(v => v.name !== 'Sin nombre' || v.cve_id);
}

// Parse JSON format
// Expected: array of objects with name, description, severity, cvss_score, cve_id
function parseJSON(content: string): ParsedVuln[] {
  try {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : data.vulnerabilities || data.results || data.findings || [data];

    return items.map((item: Record<string, unknown>) => {
      const cvss = item.cvss_score || item.cvss || item.cvss3_score;
      const severity = (item.severity || item.risk || item.threat_level || '') as string;

      return {
        name: ((item.name || item.title || item.plugin_name || 'Sin nombre') as string).substring(0, 500),
        description: item.description ? String(item.description).substring(0, 2000) : null,
        severity: severity.toLowerCase() || (cvss ? cvssToSeverity(Number(cvss)) : 'medium'),
        cvss_score: cvss ? Number(cvss) : null,
        cve_id: (item.cve_id || item.cve || null) as string | null,
        discovery_date: (item.discovery_date || item.date || new Date().toISOString().split('T')[0]) as string,
      };
    }).filter((v: ParsedVuln) => v.name !== 'Sin nombre');
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!membership) return NextResponse.json({ error: 'Sin organizacion' }, { status: 403 });

  const orgId = membership.organization_id;

  // Get form data with file
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No se envio archivo' }, { status: 400 });

  const content = await file.text();
  const fileName = file.name.toLowerCase();

  // Parse based on format
  let parsed: ParsedVuln[] = [];
  let format = '';

  if (fileName.endsWith('.nessus') || fileName.endsWith('.xml')) {
    parsed = parseNessus(content);
    format = 'Nessus (.nessus)';
  } else if (fileName.endsWith('.csv')) {
    parsed = parseCSV(content);
    format = 'CSV';
  } else if (fileName.endsWith('.json')) {
    parsed = parseJSON(content);
    format = 'JSON';
  } else {
    return NextResponse.json({ error: 'Formato no soportado. Use .nessus, .csv o .json' }, { status: 400 });
  }

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No se encontraron vulnerabilidades en el archivo' }, { status: 400 });
  }

  // Get current max code number
  const { data: lastVuln } = await supabase
    .from('vulnerabilities')
    .select('code')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (lastVuln?.code) {
    const match = lastVuln.code.match(/VUL-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  // Prepare records
  const records = parsed.map((v, i) => ({
    organization_id: orgId,
    code: `VUL-${String(nextNum + i).padStart(4, '0')}`,
    name: v.name,
    description: v.description,
    severity: v.severity,
    status: 'open',
    cvss_score: v.cvss_score,
    cve_id: v.cve_id,
    discovery_date: v.discovery_date,
    created_by: user.id,
  }));

  // Insert in batches of 100
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    const { error } = await supabase.from('vulnerabilities').insert(batch);
    if (error) {
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  await writeAuditLog({
    action: 'create',
    tableName: 'vulnerabilities',
    description: `Importacion masiva: ${inserted} vulnerabilidades desde ${format}`,
    newValues: { format, total: parsed.length, inserted, errors },
  });

  return NextResponse.json({
    success: true,
    format,
    total: parsed.length,
    inserted,
    errors,
  });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
