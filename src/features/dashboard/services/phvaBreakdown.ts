import { createClient } from '@/lib/supabase/server';

export type PhvaPhase = 'planear' | 'hacer' | 'verificar' | 'actuar';

export interface PhvaBreakdownItem {
  category: string;
  total: number;
  done: number;
  pct: number;
  details: Array<{ label: string; value: string; status: 'ok' | 'warning' | 'bad' }>;
}

export interface PhvaBreakdown {
  phase: PhvaPhase;
  phaseLabel: string;
  description: string;
  items: PhvaBreakdownItem[];
}

const PHASE_META: Record<PhvaPhase, { label: string; description: string }> = {
  planear: {
    label: 'Planear (P)',
    description: 'Establecer políticas, alcance, gestión de riesgos y planificación del SGSI',
  },
  hacer: {
    label: 'Hacer (H)',
    description: 'Implementar y operar los controles, procesos y procedimientos del SGSI',
  },
  verificar: {
    label: 'Verificar (V)',
    description: 'Monitorear, medir, auditar y revisar el desempeño del SGSI',
  },
  actuar: {
    label: 'Actuar (A)',
    description: 'Tomar acciones correctivas, preventivas y de mejora continua',
  },
};

export async function getPhvaBreakdown(orgId: string, phase: PhvaPhase): Promise<PhvaBreakdown> {
  const supabase = await createClient();
  const meta = PHASE_META[phase];
  const items: PhvaBreakdownItem[] = [];

  if (phase === 'planear') {
    const { data: risks } = await supabase
      .from('risk_scenarios').select('treatment').eq('organization_id', orgId);
    const totalRisks = risks?.length ?? 0;
    const treatedRisks = (risks ?? []).filter((r) => r.treatment && r.treatment !== 'accept').length;
    items.push({
      category: 'Riesgos con tratamiento',
      total: totalRisks,
      done: treatedRisks,
      pct: totalRisks > 0 ? Math.round((treatedRisks / totalRisks) * 100) : 0,
      details: [
        { label: 'Tratados', value: String(treatedRisks), status: 'ok' },
        { label: 'Sin tratamiento', value: String(totalRisks - treatedRisks), status: totalRisks - treatedRisks > 0 ? 'warning' : 'ok' },
      ],
    });

    const { data: docs } = await supabase
      .from('documents').select('status, document_type').eq('organization_id', orgId)
      .in('document_type', ['policy', 'procedure', 'standard']);
    const totalDocs = docs?.length ?? 0;
    const activeDocs = (docs ?? []).filter((d) => d.status === 'published' || d.status === 'approved').length;
    items.push({
      category: 'Políticas y procedimientos vigentes',
      total: totalDocs,
      done: activeDocs,
      pct: totalDocs > 0 ? Math.round((activeDocs / totalDocs) * 100) : 0,
      details: [
        { label: 'Aprobados', value: String((docs ?? []).filter((d) => d.status === 'approved').length), status: 'ok' },
        { label: 'Publicados', value: String((docs ?? []).filter((d) => d.status === 'published').length), status: 'ok' },
        { label: 'Borradores', value: String((docs ?? []).filter((d) => d.status === 'draft').length), status: 'warning' },
      ],
    });
  }

  if (phase === 'hacer') {
    const { data: controls } = await supabase
      .from('controls').select('status, overall_effectiveness').eq('organization_id', orgId);
    const total = controls?.length ?? 0;
    const impl = (controls ?? []).filter((c) => c.status === 'implemented').length;
    const partial = (controls ?? []).filter((c) => c.status === 'partially_implemented').length;
    const planned = (controls ?? []).filter((c) => c.status === 'planned').length;
    const notImpl = (controls ?? []).filter((c) => c.status === 'not_implemented').length;
    const avgEff = total > 0
      ? Math.round((controls ?? []).reduce((s, c) => s + (c.overall_effectiveness ?? 0), 0) / total)
      : 0;

    items.push({
      category: 'Implementación de controles',
      total,
      done: impl,
      pct: total > 0 ? Math.round((impl / total) * 100) : 0,
      details: [
        { label: 'Implementados', value: String(impl), status: 'ok' },
        { label: 'Parciales', value: String(partial), status: 'warning' },
        { label: 'Planificados', value: String(planned), status: 'warning' },
        { label: 'No implementados', value: String(notImpl), status: 'bad' },
      ],
    });

    items.push({
      category: 'Efectividad operativa',
      total: 100,
      done: avgEff,
      pct: avgEff,
      details: [
        { label: 'Efectividad promedio', value: `${avgEff}%`, status: avgEff >= 70 ? 'ok' : avgEff >= 40 ? 'warning' : 'bad' },
      ],
    });
  }

  if (phase === 'verificar') {
    const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();
    const { data: audits } = await supabase
      .from('audit_programs').select('status').eq('organization_id', orgId).gte('created_at', oneYearAgo);
    const totalAud = audits?.length ?? 0;
    const completed = (audits ?? []).filter((a) => a.status === 'completed').length;
    const inProgress = (audits ?? []).filter((a) => a.status === 'in_progress').length;
    const planned = (audits ?? []).filter((a) => a.status === 'planned').length;

    items.push({
      category: 'Programas de auditoría (último año)',
      total: totalAud,
      done: completed,
      pct: totalAud > 0 ? Math.round((completed / totalAud) * 100) : 0,
      details: [
        { label: 'Completadas', value: String(completed), status: 'ok' },
        { label: 'En progreso', value: String(inProgress), status: 'warning' },
        { label: 'Planificadas', value: String(planned), status: 'warning' },
      ],
    });

    const { data: soa } = await supabase
      .from('soa_entries').select('implementation_status').eq('organization_id', orgId);
    const totalSoa = soa?.length ?? 0;
    const evaluated = (soa ?? []).filter((s) => s.implementation_status !== 'not_assessed').length;
    items.push({
      category: 'Requisitos SOA evaluados',
      total: totalSoa,
      done: evaluated,
      pct: totalSoa > 0 ? Math.round((evaluated / totalSoa) * 100) : 0,
      details: [
        { label: 'Evaluados', value: String(evaluated), status: 'ok' },
        { label: 'Sin evaluar', value: String(totalSoa - evaluated), status: 'warning' },
      ],
    });
  }

  if (phase === 'actuar') {
    const { data: ncs } = await supabase
      .from('nonconformities').select('status').eq('organization_id', orgId);
    const totalNcs = ncs?.length ?? 0;
    const closed = (ncs ?? []).filter((n) => n.status === 'closed').length;
    const open = totalNcs - closed;
    items.push({
      category: 'No conformidades cerradas',
      total: totalNcs,
      done: closed,
      pct: totalNcs > 0 ? Math.round((closed / totalNcs) * 100) : 100,
      details: [
        { label: 'Cerradas', value: String(closed), status: 'ok' },
        { label: 'Abiertas', value: String(open), status: open > 0 ? 'warning' : 'ok' },
      ],
    });

    const { data: capas } = await supabase
      .from('capa_actions').select('status, is_effective').eq('organization_id', orgId);
    const totalCapa = capas?.length ?? 0;
    const effective = (capas ?? []).filter((c) =>
      c.is_effective === true || c.status === 'completed' || c.status === 'verified'
    ).length;
    items.push({
      category: 'Acciones CAPA efectivas',
      total: totalCapa,
      done: effective,
      pct: totalCapa > 0 ? Math.round((effective / totalCapa) * 100) : 100,
      details: [
        { label: 'Efectivas/completadas', value: String(effective), status: 'ok' },
        { label: 'En proceso', value: String(totalCapa - effective), status: 'warning' },
      ],
    });
  }

  return {
    phase,
    phaseLabel: meta.label,
    description: meta.description,
    items,
  };
}
