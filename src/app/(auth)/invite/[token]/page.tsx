import { Mail } from 'lucide-react';
import { AcceptInvitationClient } from '@/features/organizations/components/AcceptInvitationClient';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="w-full max-w-md px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-sky-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Invitacion a BC Compliance</h1>
        <p className="text-sm text-slate-400">
          Has sido invitado a unirte a una organizacion
        </p>
      </div>

      <AcceptInvitationClient token={token} />
    </div>
  );
}
