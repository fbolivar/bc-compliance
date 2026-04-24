import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { BcpPlan, BcpProcedure, BcpTest } from '../services/bcpService';

const BRAND = '#0EA5E9';
const DARK = '#1E293B';
const GRAY = '#64748B';
const LIGHT = '#F8FAFC';
const BORDER = '#E2E8F0';

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: DARK, paddingHorizontal: 40, paddingVertical: 36 },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: BRAND },
  headerLeft: { flexDirection: 'column', gap: 2 },
  badge: { fontSize: 7, color: BRAND, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK },
  subtitle: { fontSize: 9, color: GRAY },
  headerRight: { alignItems: 'flex-end', gap: 2 },
  meta: { fontSize: 8, color: GRAY },
  metaBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: DARK },
  // Section
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  cell: { flex: 1, minWidth: '45%', backgroundColor: LIGHT, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: BORDER },
  cellLabel: { fontSize: 7, color: GRAY, marginBottom: 2, textTransform: 'uppercase' },
  cellValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },
  // Table
  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: BRAND, paddingVertical: 5, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#F1F5F9' },
  tableCell: { fontSize: 8, color: DARK, flex: 1, flexWrap: 'wrap' },
  tableCellBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: DARK, flex: 1 },
  // Status badge
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start' },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6 },
  footerText: { fontSize: 7, color: GRAY },
  // Prose
  prose: { fontSize: 9, color: DARK, lineHeight: 1.5, backgroundColor: LIGHT, padding: 8, borderRadius: 4, borderWidth: 1, borderColor: BORDER },
  empty: { fontSize: 9, color: GRAY, fontStyle: 'italic' },
});

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

const STATUS_COLOR: Record<string, string> = {
  active: '#D1FAE5', draft: '#F1F5F9', testing: '#FEF3C7', retired: '#FEE2E2', archived: '#F3F4F6',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', draft: 'Borrador', testing: 'En Prueba', retired: 'Retirado', archived: 'Archivado',
};
const PHASE_LABEL: Record<string, string> = {
  activation: 'Activación', response: 'Respuesta', recovery: 'Recuperación',
  restoration: 'Restauración', review: 'Revisión Post-Evento',
};
const RESULT_LABEL: Record<string, string> = {
  passed: 'Aprobado', failed: 'Fallido', partial: 'Parcial', cancelled: 'Cancelado',
};

interface Props {
  plan: BcpPlan;
  procedures: BcpProcedure[];
  tests: BcpTest[];
  orgName: string;
}

export function BcpPlanPdf({ plan, procedures, tests, orgName }: Props) {
  const generatedAt = new Date().toLocaleString('es-CO');
  const phases = [...new Set(procedures.map(p => p.phase))].sort();

  return (
    <Document title={`${plan.code} - ${plan.title}`} author="BC Trust GRC">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            <Text style={s.badge}>Plan de Continuidad del Negocio · ISO 27001:2022 A.5.29</Text>
            <Text style={s.title}>{plan.title}</Text>
            <Text style={s.subtitle}>{orgName}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.metaBold}>{plan.code}</Text>
            <Text style={s.meta}>Versión {plan.version ?? '1.0'}</Text>
            <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[plan.status] ?? '#F1F5F9' }]}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{STATUS_LABEL[plan.status] ?? plan.status}</Text>
            </View>
          </View>
        </View>

        {/* Información General */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Información General</Text>
          <View style={s.grid}>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Propietario del Plan</Text>
              <Text style={s.cellValue}>{plan.owner ?? '—'}</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Aprobado por</Text>
              <Text style={s.cellValue}>{plan.approved_by ?? '—'}</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Fecha de Aprobación</Text>
              <Text style={s.cellValue}>{fmt(plan.approved_at)}</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Última Prueba</Text>
              <Text style={s.cellValue}>{fmt(plan.last_test_date)}</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>RTO Objetivo</Text>
              <Text style={s.cellValue}>{plan.rto_target_hours != null ? `${plan.rto_target_hours} horas` : '—'}</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>RPO Objetivo</Text>
              <Text style={s.cellValue}>{plan.rpo_target_hours != null ? `${plan.rpo_target_hours} horas` : '—'}</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Próxima Prueba</Text>
              <Text style={s.cellValue}>{fmt(plan.next_test_date)}</Text>
            </View>
          </View>
        </View>

        {/* Alcance */}
        {plan.scope && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Alcance</Text>
            <Text style={s.prose}>{plan.scope}</Text>
          </View>
        )}

        {/* Criterios de Activación */}
        {plan.activation_criteria && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Criterios de Activación</Text>
            <Text style={s.prose}>{plan.activation_criteria}</Text>
          </View>
        )}

        {/* Procedimientos */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Procedimientos de Recuperación ({procedures.length} pasos)</Text>
          {procedures.length === 0 ? (
            <Text style={s.empty}>Sin procedimientos registrados.</Text>
          ) : (
            phases.map(phase => {
              const phaseProcedures = procedures.filter(p => p.phase === phase).sort((a, b) => a.step_number - b.step_number);
              return (
                <View key={phase} style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRAY, marginBottom: 4 }}>
                    Fase: {PHASE_LABEL[phase] ?? phase}
                  </Text>
                  <View style={s.table}>
                    <View style={s.tableHeader}>
                      <Text style={[s.tableHeaderCell, { flex: 0.3 }]}>#</Text>
                      <Text style={[s.tableHeaderCell, { flex: 2 }]}>Título</Text>
                      <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Descripción</Text>
                      <Text style={[s.tableHeaderCell, { flex: 1 }]}>Responsable</Text>
                      <Text style={[s.tableHeaderCell, { flex: 0.6 }]}>Horas</Text>
                    </View>
                    {phaseProcedures.map((p, i) => (
                      <View key={p.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Text style={[s.tableCell, { flex: 0.3 }]}>{p.step_number}</Text>
                        <Text style={[s.tableCellBold, { flex: 2 }]}>{p.title}</Text>
                        <Text style={[s.tableCell, { flex: 1.5 }]}>{p.description ?? '—'}</Text>
                        <Text style={[s.tableCell, { flex: 1 }]}>{p.responsible ?? '—'}</Text>
                        <Text style={[s.tableCell, { flex: 0.6 }]}>{p.estimated_hours != null ? `${p.estimated_hours}h` : '—'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Historial de Pruebas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Historial de Pruebas ({tests.length})</Text>
          {tests.length === 0 ? (
            <Text style={s.empty}>Sin pruebas registradas.</Text>
          ) : (
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Fecha</Text>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Tipo</Text>
                <Text style={[s.tableHeaderCell, { flex: 0.8 }]}>Resultado</Text>
                <Text style={[s.tableHeaderCell, { flex: 0.7 }]}>RTO</Text>
                <Text style={[s.tableHeaderCell, { flex: 0.7 }]}>RPO</Text>
                <Text style={[s.tableHeaderCell, { flex: 2 }]}>Hallazgos</Text>
              </View>
              {tests.map((t, i) => (
                <View key={t.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 1 }]}>{fmt(t.test_date)}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{t.test_type.replace(/_/g, ' ')}</Text>
                  <Text style={[s.tableCellBold, { flex: 0.8 }]}>{RESULT_LABEL[t.result] ?? t.result}</Text>
                  <Text style={[s.tableCell, { flex: 0.7 }]}>{t.rto_achieved_hours != null ? `${t.rto_achieved_hours}h` : '—'}</Text>
                  <Text style={[s.tableCell, { flex: 0.7 }]}>{t.rpo_achieved_hours != null ? `${t.rpo_achieved_hours}h` : '—'}</Text>
                  <Text style={[s.tableCell, { flex: 2 }]}>{t.findings ?? '—'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notas */}
        {plan.notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notas</Text>
            <Text style={s.prose}>{plan.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>BC Trust GRC · {orgName}</Text>
          <Text style={s.footerText}>Generado: {generatedAt}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
