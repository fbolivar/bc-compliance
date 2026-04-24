/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 24, paddingBottom: 16, borderBottom: '1pt solid #e2e8f0' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    border: '1pt solid #e2e8f0',
  },
  row: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    border: '1pt solid #e2e8f0',
    borderRadius: 6,
    padding: 10,
  },
  kpiValue: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  kpiLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: '6 8',
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottom: '0.5pt solid #f1f5f9' },
  tableCell: { fontSize: 9, color: '#475569' },
  tableCellBold: { fontSize: 9, color: '#0f172a', fontWeight: 'bold' },
  tableHeaderCell: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  badge: { fontSize: 8, borderRadius: 4, padding: '2 6' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#94a3b8' },
});

interface RiskZone {
  total: number;
  extremo: number;
  alto: number;
  moderado: number;
  bajo: number;
  withPlan: number;
}

export interface ReportData {
  orgName: string;
  generatedAt: string;
  risks: RiskZone;
  openIncidents: number;
  criticalIncidents: number;
  openControls: number;
  totalControls: number;
  openNCs: number;
}

function ZoneBadge({ zone, count }: { zone: string; count: number }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Extremo: { bg: '#fef2f2', text: '#dc2626' },
    Alto: { bg: '#fffbeb', text: '#d97706' },
    Moderado: { bg: '#fefce8', text: '#ca8a04' },
    Bajo: { bg: '#f0fdf4', text: '#16a34a' },
  };
  const c = colors[zone] ?? { bg: '#f1f5f9', text: '#475569' };
  return (
    <View style={[styles.kpiCard, { backgroundColor: c.bg, borderColor: c.bg }]}>
      <Text style={[styles.kpiValue, { color: c.text, fontSize: 20 }]}>{count}</Text>
      <Text style={[styles.kpiLabel, { color: c.text }]}>{zone}</Text>
    </View>
  );
}

export function ExecutiveReportPdf({ data }: { data: ReportData }) {
  return (
    <Document title="Reporte Ejecutivo GRC" author="BC Compliance">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte Ejecutivo GRC</Text>
          <Text style={styles.subtitle}>
            {data.orgName} · Generado: {data.generatedAt}
          </Text>
        </View>

        {/* Risk KPIs */}
        <Text style={styles.sectionTitle}>Riesgos por Zona</Text>
        <View style={styles.row}>
          <ZoneBadge zone="Extremo" count={data.risks.extremo} />
          <ZoneBadge zone="Alto" count={data.risks.alto} />
          <ZoneBadge zone="Moderado" count={data.risks.moderado} />
          <ZoneBadge zone="Bajo" count={data.risks.bajo} />
        </View>
        <View style={[styles.card, { marginTop: 8 }]}>
          <Text style={{ fontSize: 9, color: '#64748b' }}>
            Total de riesgos: {data.risks.total} · Con plan de tratamiento: {data.risks.withPlan}
          </Text>
        </View>

        {/* Operational KPIs */}
        <Text style={styles.sectionTitle}>Métricas Operacionales</Text>
        <View style={styles.row}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.openIncidents}</Text>
            <Text style={styles.kpiLabel}>Incidentes abiertos</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text
              style={[
                styles.kpiValue,
                data.criticalIncidents > 0 ? { color: '#dc2626' } : {},
              ]}
            >
              {data.criticalIncidents}
            </Text>
            <Text style={styles.kpiLabel}>Incidentes críticos</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{data.totalControls}</Text>
            <Text style={styles.kpiLabel}>Controles activos</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text
              style={[
                styles.kpiValue,
                data.openNCs > 0 ? { color: '#d97706' } : {},
              ]}
            >
              {data.openNCs}
            </Text>
            <Text style={styles.kpiLabel}>No conformidades</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>BC Compliance Platform</Text>
          <Text style={styles.footerText}>Confidencial</Text>
        </View>
      </Page>
    </Document>
  );
}
