import { createClient } from '@/lib/supabase/server';

export type PhvaPhase = 'planear' | 'hacer' | 'verificar' | 'actuar';

export interface PhvaBreakdownItem {
  category: string;
  total: number;
  done: number;
  pct: number;
  details: Array<{ label: string; value: string; status: 'ok' | 'warning' | 'bad'; href?: string }>;
}

export interface PhvaTopItem {
  code: string;
  title: string;
  badge: string;
  badgeColor: 'rose' | 'amber' | 'sky' | 'slate';
  href: string;
  meta?: string;
}

export interface PhvaRecommendation {
  text: string;
  cta: string;
  href: string;
  priority: 'critical' | 'high' | 'medium';
}

export interface PhvaBreakdown {
  phase: PhvaPhase;
  phaseLabel: string;
  description: string;
  phaseScore: number;
  items: PhvaBreakdownItem[];
  topItems: PhvaTopItem[];
  topItemsTitle: string;
  recommendations: PhvaRecommendation[];
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

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

// ────────────────────────────────────────────────────────────────────────────
// PLANEAR
// ────────────────────────────────────────────────────────────────────────────

async function buildPlanear(orgId: string): Promise<{
  items: PhvaBreakdownItem[];
  topItems: PhvaTopItem[];
  topItemsTitle: string;
  recommendations: PhvaRecommendation[];
  phaseScore: number;
}> {
  const supabase = await createClient();

  const [{ data: risks }, { data: docs }] = await Promise.all([
    supabase
      .from('risk_scenarios')
      .select('id, code, name, treatment, risk_level_residual')
      .eq('organization_id', orgId),
    supabase
      .from('documents')
      .select('id, code, title, status, document_type, review_date')
      .eq('organization_id', orgId)
      .in('document_type', ['policy', 'procedure', 'standard']),
  ]);

  const allRisks = risks ?? [];
  const totalRisks = allRisks.length;
  const treatedRisks = allRisks.filter((r) => r.treatment && r.treatment !== 'accept').length;
  const acceptedRisks = allRisks.filter((r) => r.treatment === 'accept').length;
  const untreatedRisks = totalRisks - treatedRisks - acceptedRisks;
  const planRisks = totalRisks > 0 ? (treatedRisks / totalRisks) * 100 : 0;

  const allDocs = docs ?? [];
  const totalDocs = allDocs.length;
  const approved = allDocs.filter((d) => d.status === 'approved').length;
  const published = allDocs.filter((d) => d.status === 'published').length;
  const drafts = allDocs.filter((d) => d.status === 'draft').length;
  const activeDocs = approved + published;
  const planDocs = totalDocs > 0 ? (activeDocs / totalDocs) * 100 : 0;

  const phaseScore = totalRisks + totalDocs > 0
    ? Math.round((planRisks * totalRisks + planDocs * totalDocs) / (totalRisks + totalDocs))
    : 0;

  const items: PhvaBreakdownItem[] = [
    {
      category: 'Riesgos con tratamiento definido',
      total: totalRisks,
      done: treatedRisks,
      pct: pct(treatedRisks, totalRisks),
      details: [
        { label: 'Tratados', value: String(treatedRisks), status: 'ok', href: '/risks' },
        { label: 'Aceptados', value: String(acceptedRisks), status: 'warning', href: '/risks' },
        { label: 'Sin definir', value: String(untreatedRisks), status: untreatedRisks > 0 ? 'bad' : 'ok', href: '/risks' },
      ],
    },
    {
      category: 'Políticas y procedimientos vigentes',
      total: totalDocs,
      done: activeDocs,
      pct: pct(activeDocs, totalDocs),
      details: [
        { label: 'Publicados', value: String(published), status: 'ok', href: '/documents' },
        { label: 'Aprobados', value: String(approved), status: 'ok', href: '/documents' },
        { label: 'Borradores', value: String(drafts), status: drafts > 0 ? 'warning' : 'ok', href: '/documents' },
      ],
    },
  ];

  // Top items: critical/high risks without treatment first, then any untreated risks
  const ranked = [...allRisks]
    .filter((r) => !r.treatment || r.treatment === 'accept')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, very_low: 4 } as Record<string, number>;
      return (order[a.risk_level_residual] ?? 5) - (order[b.risk_level_residual] ?? 5);
    })
    .slice(0, 5);

  const topItems: PhvaTopItem[] = ranked.map((r) => ({
    code: r.code,
    title: r.name,
    badge: r.risk_level_residual === 'critical' ? 'crítico'
      : r.risk_level_residual === 'high' ? 'alto'
      : r.treatment === 'accept' ? 'aceptado' : 'sin tratamiento',
    badgeColor: r.risk_level_residual === 'critical' || r.risk_level_residual === 'high' ? 'rose' : 'amber',
    href: `/risks/${r.id}`,
  }));

  const recs: PhvaRecommendation[] = [];
  if (untreatedRisks > 0) {
    recs.push({
      text: `${untreatedRisks} riesgo${untreatedRisks > 1 ? 's' : ''} sin plan de tratamiento`,
      cta: 'Definir tratamiento',
      href: '/risks',
      priority: 'critical',
    });
  }
  if (drafts > 0) {
    recs.push({
      text: `${drafts} política${drafts > 1 ? 's' : ''} en borrador esperando aprobación`,
      cta: 'Revisar documentos',
      href: '/documents',
      priority: 'high',
    });
  }
  if (totalRisks === 0) {
    recs.push({
      text: 'No hay riesgos identificados todavía',
      cta: 'Crear primer riesgo',
      href: '/risks/new',
      priority: 'critical',
    });
  }
  if (totalDocs === 0) {
    recs.push({
      text: 'No hay políticas ni procedimientos cargados',
      cta: 'Subir documento',
      href: '/documents',
      priority: 'high',
    });
  }
  if (recs.length === 0) {
    recs.push({
      text: 'Plan en buen estado. Programa la próxima revisión de riesgos.',
      cta: 'Ver agenda',
      href: '/risks',
      priority: 'medium',
    });
  }

  return {
    items,
    topItems,
    topItemsTitle: 'Riesgos pendientes de tratamiento',
    recommendations: recs,
    phaseScore,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// HACER
// ────────────────────────────────────────────────────────────────────────────

async function buildHacer(orgId: string): Promise<{
  items: PhvaBreakdownItem[];
  topItems: PhvaTopItem[];
  topItemsTitle: string;
  recommendations: PhvaRecommendation[];
  phaseScore: number;
}> {
  const supabase = await createClient();

  const { data: controls } = await supabase
    .from('controls')
    .select('id, code, name, status, overall_effectiveness, next_review_date')
    .eq('organization_id', orgId);

  const all = controls ?? [];
  const total = all.length;
  const impl = all.filter((c) => c.status === 'implemented').length;
  const partial = all.filter((c) => c.status === 'partially_implemented').length;
  const planned = all.filter((c) => c.status === 'planned').length;
  const notImpl = all.filter((c) => c.status === 'not_implemented').length;
  const avgEff = total > 0
    ? Math.round(all.reduce((s, c) => s + (c.overall_effectiveness ?? 0), 0) / total)
    : 0;

  const phaseScore = total > 0
    ? Math.round(((impl + partial * 0.5) / total) * 100 * (avgEff / 100 + 0.5) / 1.5)
    : 0;

  const items: PhvaBreakdownItem[] = [
    {
      category: 'Implementación de controles',
      total,
      done: impl,
      pct: pct(impl, total),
      details: [
        { label: 'Implementados', value: String(impl), status: 'ok', href: '/controls' },
        { label: 'Parciales', value: String(partial), status: 'warning', href: '/controls' },
        { label: 'Planificados', value: String(planned), status: 'warning', href: '/controls' },
        { label: 'No implementados', value: String(notImpl), status: notImpl > 0 ? 'bad' : 'ok', href: '/controls' },
      ],
    },
    {
      category: 'Efectividad operativa promedio',
      total: 100,
      done: avgEff,
      pct: avgEff,
      details: [
        {
          label: 'Promedio',
          value: `${avgEff}%`,
          status: avgEff >= 70 ? 'ok' : avgEff >= 40 ? 'warning' : 'bad',
        },
      ],
    },
  ];

  // Top items: not_implemented first, then partially_implemented with low effectiveness
  const ranked = [...all]
    .sort((a, b) => {
      const order = { not_implemented: 0, planned: 1, partially_implemented: 2, implemented: 3 } as Record<string, number>;
      const da = order[a.status] ?? 4;
      const db = order[b.status] ?? 4;
      if (da !== db) return da - db;
      return (a.overall_effectiveness ?? 0) - (b.overall_effectiveness ?? 0);
    })
    .filter((c) => c.status !== 'implemented' || (c.overall_effectiveness ?? 0) < 50)
    .slice(0, 5);

  const topItems: PhvaTopItem[] = ranked.map((c) => ({
    code: c.code,
    title: c.name,
    badge: c.status === 'not_implemented' ? 'no implementado'
      : c.status === 'planned' ? 'planificado'
      : c.status === 'partially_implemented' ? 'parcial'
      : `${c.overall_effectiveness ?? 0}% efectividad`,
    badgeColor: c.status === 'not_implemented' ? 'rose'
      : c.status === 'planned' || c.status === 'partially_implemented' ? 'amber'
      : 'sky',
    href: `/controls/${c.id}`,
  }));

  const recs: PhvaRecommendation[] = [];
  if (notImpl > 0) {
    recs.push({
      text: `${notImpl} control${notImpl > 1 ? 'es' : ''} sin implementar`,
      cta: 'Asignar responsable',
      href: '/controls?status=not_implemented',
      priority: 'critical',
    });
  }
  if (avgEff < 50 && total > 0) {
    recs.push({
      text: `Efectividad promedio baja (${avgEff}%). Programa pruebas de control.`,
      cta: 'Revisar efectividad',
      href: '/controls',
      priority: 'high',
    });
  }
  if (partial > impl && impl > 0) {
    recs.push({
      text: `Más controles parciales (${partial}) que implementados (${impl})`,
      cta: 'Completar implementación',
      href: '/controls?status=partially_implemented',
      priority: 'high',
    });
  }
  if (total === 0) {
    recs.push({
      text: 'No hay controles definidos todavía',
      cta: 'Crear primer control',
      href: '/controls/new',
      priority: 'critical',
    });
  }
  if (recs.length === 0) {
    recs.push({
      text: 'Implementación operativa saludable. Mantén el ciclo de pruebas.',
      cta: 'Ver controles',
      href: '/controls',
      priority: 'medium',
    });
  }

  return {
    items,
    topItems,
    topItemsTitle: 'Controles que requieren atención',
    recommendations: recs,
    phaseScore,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// VERIFICAR
// ────────────────────────────────────────────────────────────────────────────

async function buildVerificar(orgId: string): Promise<{
  items: PhvaBreakdownItem[];
  topItems: PhvaTopItem[];
  topItemsTitle: string;
  recommendations: PhvaRecommendation[];
  phaseScore: number;
}> {
  const supabase = await createClient();
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();

  const [{ data: audits }, { data: soa }] = await Promise.all([
    supabase
      .from('audit_programs')
      .select('id, code, title, status, planned_start, actual_end, year')
      .eq('organization_id', orgId)
      .gte('created_at', oneYearAgo)
      .order('planned_start', { ascending: true }),
    supabase
      .from('soa_entries')
      .select('id, requirement_id, implementation_status, compliance_status, framework_requirements(code, name)')
      .eq('organization_id', orgId),
  ]);

  type SoaRow = {
    id: string;
    requirement_id: string;
    implementation_status: string;
    compliance_status: string;
    framework_requirements: { code: string; name: string } | null;
  };

  const auditList = audits ?? [];
  const totalAud = auditList.length;
  const completed = auditList.filter((a) => a.status === 'completed').length;
  const inProgress = auditList.filter((a) => a.status === 'in_progress').length;
  const planned = auditList.filter((a) => a.status === 'planned').length;
  const audVerify = pct(completed, totalAud);

  const soaList = (soa as unknown as SoaRow[] | null) ?? [];
  const totalSoa = soaList.length;
  const evaluated = soaList.filter((s) => s.implementation_status !== 'not_assessed').length;
  const compliant = soaList.filter((s) => s.compliance_status === 'compliant').length;
  const soaVerify = pct(evaluated, totalSoa);

  const phaseScore = Math.round(audVerify * 0.4 + soaVerify * 0.6);

  const items: PhvaBreakdownItem[] = [
    {
      category: 'Programas de auditoría (último año)',
      total: totalAud,
      done: completed,
      pct: audVerify,
      details: [
        { label: 'Completadas', value: String(completed), status: 'ok', href: '/audits' },
        { label: 'En progreso', value: String(inProgress), status: 'warning', href: '/audits' },
        { label: 'Planificadas', value: String(planned), status: 'warning', href: '/audits' },
      ],
    },
    {
      category: 'Requisitos SOA evaluados',
      total: totalSoa,
      done: evaluated,
      pct: soaVerify,
      details: [
        { label: 'Evaluados', value: String(evaluated), status: 'ok', href: '/compliance/soa' },
        { label: 'Conformes', value: String(compliant), status: 'ok', href: '/compliance/soa' },
        { label: 'Sin evaluar', value: String(totalSoa - evaluated), status: totalSoa - evaluated > 0 ? 'bad' : 'ok', href: '/compliance/soa' },
      ],
    },
  ];

  // Top items: SOA entries not assessed, then non-conformities found in SOA
  const rankedSoa = soaList
    .filter((s) => s.implementation_status === 'not_assessed' || s.compliance_status === 'non_compliant')
    .slice(0, 5);

  const topItems: PhvaTopItem[] = rankedSoa.map((s) => ({
    code: s.framework_requirements?.code ?? 'SOA',
    title: s.framework_requirements?.name ?? 'Requisito sin nombre',
    badge: s.compliance_status === 'non_compliant' ? 'no conforme' : 'sin evaluar',
    badgeColor: s.compliance_status === 'non_compliant' ? 'rose' : 'amber',
    href: `/compliance/soa`,
  }));

  const recs: PhvaRecommendation[] = [];
  if (totalSoa > 0 && totalSoa - evaluated > 0) {
    recs.push({
      text: `${totalSoa - evaluated} requisitos SOA sin evaluar`,
      cta: 'Evaluar requisitos',
      href: '/compliance/soa',
      priority: 'critical',
    });
  }
  if (totalAud === 0) {
    recs.push({
      text: 'No hay programas de auditoría planificados',
      cta: 'Crear programa',
      href: '/audits',
      priority: 'high',
    });
  }
  if (inProgress > 2) {
    recs.push({
      text: `${inProgress} auditorías en progreso simultáneamente`,
      cta: 'Revisar agenda',
      href: '/audits',
      priority: 'medium',
    });
  }
  if (totalSoa === 0) {
    recs.push({
      text: 'SOA no inicializado',
      cta: 'Generar SOA',
      href: '/compliance/soa',
      priority: 'critical',
    });
  }
  if (recs.length === 0) {
    recs.push({
      text: 'Verificación al día. Próxima auditoría planificada.',
      cta: 'Ver auditorías',
      href: '/audits',
      priority: 'medium',
    });
  }

  return {
    items,
    topItems,
    topItemsTitle: 'Requisitos SOA que requieren evaluación',
    recommendations: recs,
    phaseScore,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// ACTUAR
// ────────────────────────────────────────────────────────────────────────────

async function buildActuar(orgId: string): Promise<{
  items: PhvaBreakdownItem[];
  topItems: PhvaTopItem[];
  topItemsTitle: string;
  recommendations: PhvaRecommendation[];
  phaseScore: number;
}> {
  const supabase = await createClient();

  const [{ data: ncs }, { data: capas }] = await Promise.all([
    supabase
      .from('nonconformities')
      .select('id, code, title, status, nc_type, target_close_date')
      .eq('organization_id', orgId),
    supabase
      .from('capa_actions')
      .select('id, code, title, status, due_date, is_effective')
      .eq('organization_id', orgId),
  ]);

  const ncList = ncs ?? [];
  const totalNcs = ncList.length;
  const closed = ncList.filter((n) => n.status === 'closed').length;
  const open = totalNcs - closed;
  const today = new Date();
  const overdue = ncList.filter(
    (n) => n.status !== 'closed' && n.target_close_date && new Date(n.target_close_date) < today
  ).length;
  const ncRatio = totalNcs > 0 ? (closed / totalNcs) * 100 : 100;

  const capaList = capas ?? [];
  const totalCapa = capaList.length;
  const effective = capaList.filter(
    (c) => c.is_effective === true || c.status === 'completed' || c.status === 'verified'
  ).length;
  const capaOverdue = capaList.filter(
    (c) =>
      c.status !== 'completed' &&
      c.status !== 'verified' &&
      c.status !== 'cancelled' &&
      c.due_date &&
      new Date(c.due_date) < today
  ).length;
  const capaRatio = totalCapa > 0 ? (effective / totalCapa) * 100 : 100;

  const phaseScore = Math.round(ncRatio * 0.5 + capaRatio * 0.5);

  const items: PhvaBreakdownItem[] = [
    {
      category: 'No conformidades cerradas',
      total: totalNcs,
      done: closed,
      pct: pct(closed, totalNcs),
      details: [
        { label: 'Cerradas', value: String(closed), status: 'ok', href: '/nonconformities' },
        { label: 'Abiertas', value: String(open), status: open > 0 ? 'warning' : 'ok', href: '/nonconformities' },
        { label: 'Vencidas', value: String(overdue), status: overdue > 0 ? 'bad' : 'ok', href: '/nonconformities' },
      ],
    },
    {
      category: 'Acciones CAPA efectivas',
      total: totalCapa,
      done: effective,
      pct: pct(effective, totalCapa),
      details: [
        { label: 'Efectivas/completadas', value: String(effective), status: 'ok', href: '/nonconformities' },
        { label: 'En proceso', value: String(totalCapa - effective), status: 'warning', href: '/nonconformities' },
        { label: 'Vencidas', value: String(capaOverdue), status: capaOverdue > 0 ? 'bad' : 'ok', href: '/nonconformities' },
      ],
    },
  ];

  // Top items: overdue NCs first, then major NCs not closed, then any open
  const rankedNcs = [...ncList]
    .filter((n) => n.status !== 'closed')
    .sort((a, b) => {
      const aOver = a.target_close_date && new Date(a.target_close_date) < today ? 0 : 1;
      const bOver = b.target_close_date && new Date(b.target_close_date) < today ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      const order = { major: 0, minor: 1, observation: 2 } as Record<string, number>;
      return (order[a.nc_type] ?? 3) - (order[b.nc_type] ?? 3);
    })
    .slice(0, 5);

  const topItems: PhvaTopItem[] = rankedNcs.map((n) => {
    const isOverdue = n.target_close_date && new Date(n.target_close_date) < today;
    const daysLeft = n.target_close_date
      ? Math.ceil((new Date(n.target_close_date).getTime() - today.getTime()) / 86400000)
      : null;
    return {
      code: n.code,
      title: n.title,
      badge: isOverdue ? `vencida ${Math.abs(daysLeft ?? 0)}d`
        : n.nc_type === 'major' ? 'mayor'
        : daysLeft !== null && daysLeft <= 7 ? `${daysLeft}d restantes`
        : n.nc_type,
      badgeColor: isOverdue || n.nc_type === 'major' ? 'rose' : 'amber',
      href: `/nonconformities/${n.id}`,
      meta: n.target_close_date ?? undefined,
    };
  });

  const recs: PhvaRecommendation[] = [];
  if (overdue > 0) {
    recs.push({
      text: `${overdue} no conformidad${overdue > 1 ? 'es' : ''} vencida${overdue > 1 ? 's' : ''}`,
      cta: 'Atender vencidas',
      href: '/nonconformities?overdue=1',
      priority: 'critical',
    });
  }
  if (capaOverdue > 0) {
    recs.push({
      text: `${capaOverdue} acción${capaOverdue > 1 ? 'es' : ''} CAPA con plazo vencido`,
      cta: 'Reasignar plazos',
      href: '/nonconformities',
      priority: 'critical',
    });
  }
  if (open > 0 && overdue === 0) {
    recs.push({
      text: `${open} no conformidad${open > 1 ? 'es' : ''} abierta${open > 1 ? 's' : ''}`,
      cta: 'Ver pendientes',
      href: '/nonconformities',
      priority: 'high',
    });
  }
  if (totalCapa === 0 && totalNcs > 0) {
    recs.push({
      text: 'Hay NCs sin plan de acción CAPA',
      cta: 'Definir CAPA',
      href: '/nonconformities',
      priority: 'high',
    });
  }
  if (recs.length === 0) {
    recs.push({
      text: 'Mejora continua al día. Programa la próxima revisión por la dirección.',
      cta: 'Ver agenda',
      href: '/audits',
      priority: 'medium',
    });
  }

  return {
    items,
    topItems,
    topItemsTitle: 'No conformidades pendientes',
    recommendations: recs,
    phaseScore,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────────

export async function getPhvaBreakdown(orgId: string, phase: PhvaPhase): Promise<PhvaBreakdown> {
  const meta = PHASE_META[phase];

  const builder =
    phase === 'planear' ? buildPlanear
      : phase === 'hacer' ? buildHacer
      : phase === 'verificar' ? buildVerificar
      : buildActuar;

  const result = await builder(orgId);

  return {
    phase,
    phaseLabel: meta.label,
    description: meta.description,
    ...result,
  };
}
