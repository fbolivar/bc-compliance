'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/shared/lib/audit';

export type CreateClientResult = {
  success?: boolean;
  error?: string;
  tempPassword?: string;
};

export async function createClientOrg(formData: FormData): Promise<CreateClientResult> {
  // Verify current user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const orgName = (formData.get('org_name') as string)?.trim();
  const contactName = (formData.get('contact_name') as string)?.trim();
  const industry = formData.get('industry') as string;
  const country = formData.get('country') as string;
  const plan = (formData.get('plan') as string) || 'starter';

  if (!email || !orgName) {
    return { error: 'Email y nombre de organizacion son requeridos' };
  }

  // Generate a temporary password
  const tempPassword = generateTempPassword();

  try {
    const serviceClient = createServiceClient();

    // 1. Create user in Supabase Auth (this triggers handle_new_user which creates profile + org + membership)
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm so they can login immediately
      user_metadata: {
        full_name: contactName || orgName,
      },
    });

    if (createError) {
      if (createError.message.includes('already been registered')) {
        return { error: 'Este email ya esta registrado en el sistema' };
      }
      return { error: createError.message };
    }

    if (!newUser.user) return { error: 'Error al crear usuario' };

    // 2. Wait a moment for the trigger to execute, then update the auto-created org
    // The trigger creates a default org named after the email, we update it with the real info
    const { data: membership } = await serviceClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', newUser.user.id)
      .limit(1)
      .single();

    if (membership) {
      await serviceClient
        .from('organizations')
        .update({
          name: orgName,
          slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          industry: industry || null,
          country: country || null,
          plan: plan,
        })
        .eq('id', membership.organization_id);

      // Update profile with contact name
      if (contactName) {
        await serviceClient
          .from('profiles')
          .update({ full_name: contactName })
          .eq('id', newUser.user.id);
      }
    }

    // 3. Send password reset email so client can set their own password
    await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bc-compliance.vercel.app'}/update-password`,
      },
    });

    // 4. Audit log
    await writeAuditLog({
      action: 'create',
      tableName: 'clients',
      recordId: newUser.user.id,
      description: `Cliente creado: ${orgName} (${email})`,
      newValues: { email, orgName, plan },
    });

    revalidatePath('/settings/clients');
    return { success: true, tempPassword };
  } catch (err) {
    return { error: 'Error interno al crear el cliente' };
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const special = '!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  // Add a special char and number to meet password requirements
  password += special[Math.floor(Math.random() * special.length)];
  password += Math.floor(Math.random() * 10);
  return password;
}

export async function listClients() {
  // Try service client first (can see all orgs), fallback to regular client (sees own org only)
  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('organizations')
      .select('id, name, slug, industry, country, plan, is_active, created_at, organization_members(user_id, is_owner, profiles(email, full_name))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    // Fallback: use regular client (RLS-scoped, will only show user's own org)
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('organizations')
        .select('id, name, slug, industry, country, plan, is_active, created_at, organization_members(user_id, is_owner, profiles(email, full_name))')
        .order('created_at', { ascending: false });
      return data || [];
    } catch {
      return [];
    }
  }
}
