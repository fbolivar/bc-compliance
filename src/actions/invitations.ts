'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/shared/lib/audit';

export type InvitationResult = {
  success?: boolean;
  error?: string;
};

// Get user's org id (inline to avoid circular deps)
async function getOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  return data?.organization_id || null;
}

export async function sendInvitation(formData: FormData): Promise<InvitationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = (formData.get('role') as string) || 'viewer';
  const message = formData.get('message') as string;

  if (!email) return { error: 'Email requerido' };

  // Check if there's already a pending invitation for this email
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return { error: 'Ya existe una invitacion pendiente para este email' };

  // Check if user is already a member (by matching email in profiles)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (profile) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (membership) return { error: 'Este usuario ya es miembro de la organizacion' };
  }

  // Create invitation
  const { error } = await supabase
    .from('invitations')
    .insert({
      organization_id: orgId,
      email,
      role,
      message: message || null,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'create',
    tableName: 'invitations',
    description: `Invitacion enviada a ${email} con rol ${role}`,
  });

  revalidatePath('/settings/users');
  return { success: true };
}

export async function revokeInvitation(invitationId: string): Promise<InvitationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)
    .eq('status', 'pending');

  if (error) return { error: error.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'invitations',
    recordId: invitationId,
    description: 'Invitacion revocada',
  });

  revalidatePath('/settings/users');
  return { success: true };
}

export async function resendInvitation(invitationId: string): Promise<InvitationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('invitations')
    .update({
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', invitationId)
    .eq('status', 'pending');

  if (error) return { error: error.message };

  revalidatePath('/settings/users');
  return { success: true };
}

export async function acceptInvitationByToken(token: string): Promise<InvitationResult & { orgId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Debes iniciar sesion para aceptar la invitacion' };

  // Use RPC to call the accept_invitation function (SECURITY DEFINER bypasses RLS)
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_token: token,
    p_user_id: user.id,
  });

  if (error) return { error: error.message };

  const result = data as { success?: boolean; error?: string; organization_id?: string };

  if (result.error) return { error: result.error };

  revalidatePath('/dashboard');
  revalidatePath('/settings/users');
  return { success: true, orgId: result.organization_id };
}

export async function getInvitationByToken(token: string) {
  // Use service client to read invitation without RLS (user might not be in org yet)
  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('invitations')
      .select('id, email, role, status, expires_at, organizations(name, slug)')
      .eq('token', token)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    // Service role key not configured - fallback
    return null;
  }
}
