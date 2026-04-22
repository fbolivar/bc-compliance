/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { MspiPosture } from '@/features/dashboard/services/executiveDashboardService';
import type { FrameworkRow } from '@/features/compliance/services/complianceService';
import type { SnapshotRow } from '@/features/dashboard/services/snapshotService';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b', lineHeight: 1.5 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#0ea5e9',
  },
  brand: { color: '#0ea5e9', fontSize: 16, fontFamily: 'Helvetica-Bold' },
  brandSub: { color: '#64748b', fontSize: 9, marginTop: 2 },
  date: { color: '#64748b', fontSize: 9 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#64748b', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0ea5e9',
    marginBottom: 10, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  scoreRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  scoreBox: {
    flex: 1, padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  scoreValue: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#0ea5e9' },
  scoreLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.5 },
  scoreDesc: { fontSize: 8, color: '#94a3b8', marginTop: 4 },
  table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableHeader: { backgroundColor: '#0ea5e9', color: '#fff' },
  tableCell: { padding: 6, fontSize: 9 },
  cellName: { flex: 3 },
  cellNum: { flex: 1, textAlign: 'right' },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  pill: {
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, fontSize: 8,
    backgroundColor: '#e0f2fe', color: '#0c4a6e',
  },
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0',
    flexDirection: 'row', justifyContent: 'space-between',
    fontSize: 8, color: '#94a3b8',
  },
  text: { fontSize: 10, color: '#334155', marginBottom: 4 },
  bullet: { marginLeft: 8, marginBottom: 2, fontSize: 9, color: '#475569' },
  alertBox: {
    padding: 8, borderRadius: 4, backgroundColor: '#fef3c7',
    borderLeftWidth: 3, borderLeftColor: '#f59e0b', marginBottom: 6,
  },
  alertCritical: { backgroundColor: '#fee2e2', borderLeftColor: '#dc2626' },
  recommend: { padding: 10, backgroundColor: '#f0f9ff', borderRadius: 4, borderLeftWidth: 3, borderLeftColor: '#0ea5e9', marginTop: 6 },
});

interface Props {
  orgName: string;
  reportMonth: string; // 'Abril 2026'
  posture: MspiPosture;
  frameworks: FrameworkRow[];
  history: SnapshotRow[];
  metrics: {
    activeIncidents: number;
    openVulns: number;
    criticalVulns: number;
    openNcs: number;
    overdueNcs: number;
    implementedControls: number;
    totalControls: number;
  };
  topGaps: Array<{ code: string; title: string; level: string; type: string }>;
}

function maturityRecommendation(score: number): string {
  if (score >= 80)
    return 'La organización mantiene un nivel optimizado. Foco recomendado: mejora continua, automatización y benchmarking sectorial.';
  if (score >= 60)
    return 'Nivel gestionado con métricas. Foco recomendado: optimización de procesos críticos, expansión de monitoreo y refinamiento de tableros KRI.';
  if (score >= 40)
    return 'Procesos definidos. Foco recomendado: estandarización, automatización de evaluaciones y consolidación del SGSI en todas las áreas misionales.';
  if (score >= 20)
    return 'Procesos repetibles pero no documentados. Foco recomendado: formalización de políticas, capacitación masiva y cierre de controles críticos.';
  if (score > 0)
    return 'Estado inicial. Foco recomendado: definición urgente de políticas básicas, asignación de responsables y plan de implementación 90/180/365 días.';
  return 'Sin procesos formales. Acción inmediata: kick-off del SGSI con asesoría especializada, evaluación inicial y roadmap de 18 meses.';
}

export const ExecutiveMonthlyReport: React.FC<Props> = ({
  orgName, reportMonth, posture, frameworks, history, metrics, topGaps,
}) => {
  const trendCurrent = history[history.length - 1]?.mspi_score ?? posture.score;
  const trendStart = history[0]?.mspi_score ?? posture.score;
  const trendDelta = trendCurrent - trendStart;
  const trendStr = trendDelta > 0 ? `+${trendDelta} pts` : trendDelta < 0 ? `${trendDelta} pts` : 'Sin cambio';

  return (
    <Document title={`Informe Ejecutivo SGSI - ${reportMonth}`}>
      {/* Página 1: Resumen ejecutivo */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BC Trust</Text>
            <Text style={styles.brandSub}>Plataforma GRC &amp; SecOps</Text>
          </View>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</Text>
        </View>

        <Text style={styles.title}>Informe Ejecutivo SGSI</Text>
        <Text style={styles.subtitle}>{orgName} · Periodo: {reportMonth}</Text>

        {/* Postura MSPI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Postura de Seguridad MSPI</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{posture.score}</Text>
              <Text style={styles.scoreLabel}>Score Global</Text>
              <Text style={styles.scoreDesc}>de 100 · Nivel {posture.levelLabel}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{trendStr}</Text>
              <Text style={styles.scoreLabel}>Tendencia 30 días</Text>
              <Text style={styles.scoreDesc}>vs inicio del periodo</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{frameworks.length}</Text>
              <Text style={styles.scoreLabel}>Frameworks Activos</Text>
              <Text style={styles.scoreDesc}>en evaluación</Text>
            </View>
          </View>

          <View style={styles.recommend}>
            <Text style={{ ...styles.text, fontFamily: 'Helvetica-Bold' }}>Recomendación estratégica:</Text>
            <Text style={styles.text}>{maturityRecommendation(posture.score)}</Text>
          </View>
        </View>

        {/* PHVA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ciclo PHVA</Text>
          <View style={styles.scoreRow}>
            {(['planear', 'hacer', 'verificar', 'actuar'] as const).map((k) => (
              <View key={k} style={styles.scoreBox}>
                <Text style={styles.scoreValue}>{posture.phva[k]}%</Text>
                <Text style={styles.scoreLabel}>{k}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Operational metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operación SecOps</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={{ ...styles.scoreValue, color: metrics.activeIncidents > 0 ? '#ea580c' : '#0ea5e9' }}>
                {metrics.activeIncidents}
              </Text>
              <Text style={styles.scoreLabel}>Incidentes activos</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={{ ...styles.scoreValue, color: metrics.criticalVulns > 0 ? '#dc2626' : '#0ea5e9' }}>
                {metrics.criticalVulns}
              </Text>
              <Text style={styles.scoreLabel}>Vulns críticas</Text>
              <Text style={styles.scoreDesc}>{metrics.openVulns} abiertas total</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={{ ...styles.scoreValue, color: metrics.overdueNcs > 0 ? '#dc2626' : '#0ea5e9' }}>
                {metrics.openNcs}
              </Text>
              <Text style={styles.scoreLabel}>NCs abiertas</Text>
              <Text style={styles.scoreDesc}>
                {metrics.overdueNcs > 0 ? `${metrics.overdueNcs} vencidas` : 'al día'}
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>
                {Math.round((metrics.implementedControls / Math.max(1, metrics.totalControls)) * 100)}%
              </Text>
              <Text style={styles.scoreLabel}>Controles implementados</Text>
              <Text style={styles.scoreDesc}>
                {metrics.implementedControls}/{metrics.totalControls}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>BC Trust · Informe confidencial generado automáticamente</Text>
          <Text>Página 1 de 2</Text>
        </View>
      </Page>

      {/* Página 2: Frameworks + Top Gaps */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BC Trust</Text>
            <Text style={styles.brandSub}>{orgName} · {reportMonth}</Text>
          </View>
          <Text style={styles.date}>Continuación</Text>
        </View>

        {/* Cumplimiento por framework */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cumplimiento por Marco Normativo</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.cellName, { color: '#fff' }]}>Framework</Text>
              <Text style={[styles.tableCell, styles.cellNum, { color: '#fff' }]}>Total</Text>
              <Text style={[styles.tableCell, styles.cellNum, { color: '#fff' }]}>OK</Text>
              <Text style={[styles.tableCell, styles.cellNum, { color: '#fff' }]}>Parcial</Text>
              <Text style={[styles.tableCell, styles.cellNum, { color: '#fff' }]}>NoCump</Text>
              <Text style={[styles.tableCell, styles.cellNum, { color: '#fff' }]}>%</Text>
            </View>
            {frameworks
              .sort((a, b) => a.compliance_percentage - b.compliance_percentage)
              .map((fw) => (
                <View key={fw.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.cellName]}>{fw.name}</Text>
                  <Text style={[styles.tableCell, styles.cellNum]}>{fw.total_requirements}</Text>
                  <Text style={[styles.tableCell, styles.cellNum, { color: '#16a34a' }]}>{fw.compliant_count}</Text>
                  <Text style={[styles.tableCell, styles.cellNum, { color: '#ea580c' }]}>{fw.partial_count}</Text>
                  <Text style={[styles.tableCell, styles.cellNum, { color: '#dc2626' }]}>{fw.non_compliant_count}</Text>
                  <Text style={[styles.tableCell, styles.cellNum, { fontFamily: 'Helvetica-Bold' }]}>
                    {fw.compliance_percentage}%
                  </Text>
                </View>
              ))}
          </View>
        </View>

        {/* Top brechas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 8 Brechas Críticas que Requieren Atención Directiva</Text>
          {topGaps.length === 0 ? (
            <Text style={styles.text}>✓ Sin brechas críticas detectadas en este momento.</Text>
          ) : (
            topGaps.map((g, i) => (
              <View
                key={`${g.code}-${i}`}
                style={[styles.alertBox, g.level === 'critical' ? styles.alertCritical : {}]}
              >
                <Text style={{ ...styles.text, fontFamily: 'Helvetica-Bold', marginBottom: 0 }}>
                  [{g.code}] {g.title}
                </Text>
                <Text style={{ fontSize: 8, color: '#64748b' }}>
                  Tipo: {g.type} · Nivel: {g.level}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Próximos pasos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Pasos Recomendados</Text>
          <Text style={styles.bullet}>• Revisar las brechas críticas listadas y asignar responsable directivo a cada una.</Text>
          <Text style={styles.bullet}>• Programar comité de seguridad para análisis del nivel MSPI y plan de mejora.</Text>
          <Text style={styles.bullet}>• Si hay incidentes activos, validar que cuenten con plan de tratamiento documentado.</Text>
          <Text style={styles.bullet}>• Completar auditorías programadas en el periodo siguiente.</Text>
          <Text style={styles.bullet}>• Verificar evidencias de implementación de controles parciales (etapa intermedia).</Text>
        </View>

        <View style={styles.footer}>
          <Text>BC Trust · Informe confidencial generado automáticamente</Text>
          <Text>Página 2 de 2</Text>
        </View>
      </Page>
    </Document>
  );
};
