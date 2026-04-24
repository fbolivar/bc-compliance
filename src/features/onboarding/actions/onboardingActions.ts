'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/shared/lib/get-org';
import { revalidatePath } from 'next/cache';

export interface OrgProfileData {
  name: string;
  industry: string;
  country: string;
  employee_count: string;
  contact_email: string;
}

export async function saveOrgProfile(data: OrgProfileData): Promise<{ error?: string }> {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Merge profile-specific fields into settings JSONB
  const { data: org } = await supabase.from('organizations').select('settings').eq('id', orgId).single();
  const currentSettings = (org?.settings ?? {}) as Record<string, unknown>;

  const { error } = await supabase
    .from('organizations')
    .update({
      name: data.name,
      industry: data.industry || null,
      country: data.country || null,
      settings: {
        ...currentSettings,
        employee_count: data.employee_count || null,
        contact_email: data.contact_email || null,
      },
    })
    .eq('id', orgId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return {};
}

export interface FrameworkSelection {
  frameworks: string[];
}

export async function saveFrameworkSelection(data: FrameworkSelection): Promise<{ error?: string }> {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from('organizations')
    .update({
      settings: { selected_frameworks: data.frameworks },
    })
    .eq('id', orgId);

  if (error) return { error: error.message };
  return {};
}

export async function completeOnboarding(): Promise<{ error?: string }> {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Merge onboarding flag into existing settings JSONB
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  const currentSettings = (org?.settings ?? {}) as Record<string, unknown>;

  const { error } = await supabase
    .from('organizations')
    .update({
      settings: { ...currentSettings, onboarding_completed: true },
    })
    .eq('id', orgId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return {};
}
