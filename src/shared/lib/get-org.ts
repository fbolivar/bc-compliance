import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getCurrentOrg() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, slug, plan, is_platform_owner)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  const orgId = membership?.organization_id || null;

  // Check if this org is the platform owner
  let isPlatformOwner = false;
  if (orgId) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('is_platform_owner')
      .eq('id', orgId)
      .single();
    isPlatformOwner = orgData?.is_platform_owner === true;
  }

  return {
    user,
    orgId,
    organization: membership?.organizations || null,
    isPlatformOwner,
  };
}

export async function requireOrg() {
  const { user, orgId, organization } = await getCurrentOrg();

  if (!orgId) {
    // User has no org - this shouldn't happen with the auto-provision trigger
    // but redirect to login as fallback
    redirect('/login');
  }

  return { user, orgId, organization };
}
