'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'view';

interface AuditLogParams {
  action: AuditAction;
  tableName: string;
  recordId?: string;
  description: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export async function writeAuditLog(params: AuditLogParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get org id
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!membership) return;

    // Get request info
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const ua = headersList.get('user-agent') || 'unknown';

    await supabase.from('audit_logs').insert({
      organization_id: membership.organization_id,
      user_id: user.id,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId || null,
      description: params.description,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
      ip_address: ip.split(',')[0].trim(),
      user_agent: ua.substring(0, 500),
    });
  } catch {
    // Audit logging should never break the main flow
  }
}
