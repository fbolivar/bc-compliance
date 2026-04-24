import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { SetupWizard } from '@/features/onboarding/components/SetupWizard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configuración inicial · BC Trust GRC' };

export default async function SetupPage() {
  const { orgId, organization } = await getCurrentOrg();
  if (!orgId) redirect('/login');

  const org = organization as { name?: string; settings?: Record<string, unknown> | null } | null;

  // Skip wizard if already completed
  if (org?.settings?.onboarding_completed) {
    redirect('/dashboard');
  }

  return <SetupWizard orgName={org?.name ?? 'Mi Organización'} />;
}
