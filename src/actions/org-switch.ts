'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';

export async function setActiveOrg(orgId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // Verify membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .limit(1)
    .single();
  if (!membership) return { error: 'Sin acceso a esa organización' };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });

  // Revalidate everything to refresh server components with new org context
  revalidatePath('/', 'layout');
  return { success: true };
}
