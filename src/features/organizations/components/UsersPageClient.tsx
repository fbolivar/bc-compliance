'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { InviteUserForm } from './InviteUserForm';
import { InvitationsList } from './InvitationsList';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

interface UsersPageClientProps {
  invitations: Invitation[];
  siteUrl: string;
}

export function UsersPageClient({ invitations, siteUrl }: UsersPageClientProps) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowInvite(true)}
        className="flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Invitar usuario
      </button>

      <InviteUserForm isOpen={showInvite} onClose={() => setShowInvite(false)} />

      <InvitationsList invitations={invitations} siteUrl={siteUrl} />
    </>
  );
}
