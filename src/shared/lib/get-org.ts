import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';

export interface OrgMembership {
  id: string;
  name: string;
  slug: string | null;
  plan: string | null;
  is_platform_owner: boolean | null;
}

/**
 * Returns the user's active organization. Selection priority:
 *   1. Cookie `active_org_id` (if user is still member of that org)
 *   2. First active membership (fallback)
 */
export async function getCurrentOrg() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch ALL memberships (we need the full list for the switcher)
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, slug, plan, is_platform_owner)')
    .eq('user_id', user.id)
    .eq('is_active', true);

  type Row = {
    organization_id: string;
    organizations: OrgMembership | null;
  };
  const rows = (memberships ?? []) as unknown as Row[];

  if (rows.length === 0) {
    return {
      user,
      orgId: null,
      organization: null,
      isPlatformOwner: false,
      userName: null,
      memberships: [],
    };
  }

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const matched = cookieOrgId
    ? rows.find((r) => r.organization_id === cookieOrgId)
    : null;
  const active = matched ?? rows[0];

  const orgId = active.organization_id;
  const organization = active.organizations;
  const isPlatformOwner = organization?.is_platform_owner === true;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return {
    user,
    orgId,
    organization,
    isPlatformOwner,
    userName: profile?.full_name || null,
    memberships: rows.map((r) => r.organizations).filter(Boolean) as OrgMembership[],
  };
}

export async function requireOrg() {
  const { user, orgId, organization } = await getCurrentOrg();

  if (!orgId) {
    redirect('/login');
  }

  return { user, orgId, organization };
}
