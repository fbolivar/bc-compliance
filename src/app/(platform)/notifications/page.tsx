import { requireOrg } from '@/shared/lib/get-org';
import { PageHeader } from '@/shared/components/PageHeader';
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
} from '@/features/automation/services/notificationService';
import { NotificationsCenter } from '@/features/automation/components/NotificationsCenter';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const { user, orgId } = await requireOrg();
  const [items, unread] = await Promise.all([
    getNotificationsForUser(orgId, user.id, 100),
    getUnreadNotificationCount(orgId, user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro de Notificaciones"
        description={`${unread} sin leer · ${items.length} total`}
      />
      <NotificationsCenter items={items} unreadCount={unread} />
    </div>
  );
}
