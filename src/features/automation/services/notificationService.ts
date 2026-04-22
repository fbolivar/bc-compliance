import { createClient } from '@/lib/supabase/server';

export interface NotificationRow {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function getNotificationsForUser(
  orgId: string,
  userId: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as NotificationRow[];
}

export async function getUnreadNotificationCount(orgId: string, userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('is_read', false);
  return count ?? 0;
}
