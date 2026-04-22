'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserOrgId } from '@/shared/lib/actions-helpers';

export type ActionResult = {
  success?: boolean;
  error?: string;
};

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/notifications');
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult & { updated?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const { error, count } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() }, { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { error: error.message };
  revalidatePath('/notifications');
  return { success: true, updated: count ?? 0 };
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/notifications');
  return { success: true };
}

/**
 * Genera notificaciones sinteticas basadas en el estado actual del SGSI.
 * Util como demo y como motor simple de alertas.
 */
export async function generateSystemAlerts(): Promise<ActionResult & { created?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const notifications: Array<{
    title: string;
    message: string;
    notification_type: string;
    entity_type: string | null;
    entity_id: string | null;
  }> = [];

  // 1) Riesgos criticos sin controles
  const { data: critRisks } = await supabase
    .from('risk_scenarios')
    .select('id, code, name')
    .eq('organization_id', orgId)
    .eq('risk_level_residual', 'critical');

  if (critRisks && critRisks.length > 0) {
    const crmRows = await supabase
      .from('control_risk_mappings')
      .select('risk_scenario_id')
      .eq('organization_id', orgId)
      .in('risk_scenario_id', critRisks.map((r) => r.id));
    const coveredIds = new Set((crmRows.data ?? []).map((r) => r.risk_scenario_id));
    for (const r of critRisks) {
      if (!coveredIds.has(r.id)) {
        notifications.push({
          title: 'Riesgo crítico sin controles',
          message: `El riesgo ${r.code} "${r.name}" tiene nivel residual crítico y no tiene controles mitigantes asignados.`,
          notification_type: 'warning',
          entity_type: 'risk_scenario',
          entity_id: r.id,
        });
      }
    }
  }

  // 2) Vulnerabilidades criticas abiertas
  const { data: critVulns } = await supabase
    .from('vulnerabilities')
    .select('id, code, title')
    .eq('organization_id', orgId)
    .eq('severity', 'critical')
    .eq('status', 'open');

  for (const v of critVulns ?? []) {
    notifications.push({
      title: 'Vulnerabilidad crítica abierta',
      message: `${v.code}: ${v.title} requiere remediación inmediata.`,
      notification_type: 'critical',
      entity_type: 'vulnerability',
      entity_id: v.id,
    });
  }

  // 3) Incidentes sin cerrar
  const { data: openIncidents } = await supabase
    .from('incidents')
    .select('id, code, title')
    .eq('organization_id', orgId)
    .not('status', 'in', '(closed,post_incident)');

  for (const i of openIncidents ?? []) {
    notifications.push({
      title: 'Incidente abierto requiere seguimiento',
      message: `${i.code}: ${i.title}`,
      notification_type: 'info',
      entity_type: 'incident',
      entity_id: i.id,
    });
  }

  // 4) No conformidades con fecha limite proxima o vencida
  const { data: ncs } = await supabase
    .from('nonconformities')
    .select('id, code, title, target_close_date')
    .eq('organization_id', orgId)
    .neq('status', 'closed')
    .not('target_close_date', 'is', null);

  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 86400000);
  for (const nc of ncs ?? []) {
    const due = new Date(nc.target_close_date!);
    if (due < today) {
      notifications.push({
        title: 'No conformidad vencida',
        message: `${nc.code}: ${nc.title} venció el ${due.toLocaleDateString('es-CO')}.`,
        notification_type: 'critical',
        entity_type: 'nonconformity',
        entity_id: nc.id,
      });
    } else if (due < thirtyDays) {
      notifications.push({
        title: 'No conformidad próxima a vencer',
        message: `${nc.code}: ${nc.title} vence el ${due.toLocaleDateString('es-CO')}.`,
        notification_type: 'warning',
        entity_type: 'nonconformity',
        entity_id: nc.id,
      });
    }
  }

  if (notifications.length === 0) {
    return { success: true, created: 0 };
  }

  const rows = notifications.map((n) => ({
    organization_id: orgId,
    user_id: user.id,
    ...n,
  }));

  const { error, data } = await supabase.from('notifications').insert(rows).select('id');
  if (error) return { error: error.message };

  revalidatePath('/notifications');
  return { success: true, created: data?.length ?? 0 };
}
