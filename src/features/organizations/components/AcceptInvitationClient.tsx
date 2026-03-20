'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { acceptInvitationByToken, getInvitationByToken } from '@/actions/invitations';
import { Shield, Check, AlertTriangle, LogIn } from 'lucide-react';
import Link from 'next/link';

interface AcceptInvitationClientProps {
  token: string;
}

interface InvitationInfo {
  email: string;
  role: string;
  status: string;
  expires_at: string;
  organizations: { name: string; slug: string } | null;
}

export function AcceptInvitationClient({ token }: AcceptInvitationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);

  useEffect(() => {
    async function checkInvitation() {
      const data = await getInvitationByToken(token);
      if (data) {
        setInvitation(data as unknown as InvitationInfo);
      }
      setChecking(false);
    }
    checkInvitation();
  }, [token]);

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    const result = await acceptInvitationByToken(token);

    if (result.error) {
      if (result.error.includes('sesion') || result.error.includes('autenticado')) {
        setError('login_required');
      } else {
        setError(result.error);
      }
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Verificando invitacion...</p>
      </div>
    );
  }

  if (!invitation || invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Invitacion no valida</h2>
          <p className="text-sm text-slate-400">
            Esta invitacion ha expirado, fue revocada o ya fue utilizada.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Ir al login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Bienvenido</h2>
          <p className="text-sm text-slate-400">
            Te has unido a {invitation.organizations?.name || 'la organizacion'} exitosamente.
            Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error === 'login_required') {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <LogIn className="w-12 h-12 text-cyan-400 mx-auto" />
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Inicia sesion primero</h2>
          <p className="text-sm text-slate-400">
            Necesitas una cuenta para aceptar esta invitacion. Contacta al administrador si no tienes cuenta.
          </p>
        </div>
        <Link
          href={`/login?redirect=/invite/${token}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Iniciar sesion
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div>
            <p className="text-xs text-slate-500 mb-1">Organizacion</p>
            <p className="text-sm font-medium text-white">{invitation.organizations?.name || '-'}</p>
          </div>
          <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Rol asignado</p>
            <p className="text-sm font-medium text-white capitalize">{invitation.role.replace(/_/g, ' ')}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Email</p>
            <p className="text-sm font-medium text-white truncate">{invitation.email}</p>
          </div>
        </div>
      </div>

      {error && error !== 'login_required' && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
          {error}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
        Aceptar invitacion
      </button>
    </div>
  );
}
