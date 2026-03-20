'use client';

import { useState } from 'react';
import { revokeInvitation, resendInvitation } from '@/actions/invitations';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { XCircle, RefreshCw, Copy, Check, Clock } from 'lucide-react';

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

interface InvitationsListProps {
  invitations: Invitation[];
  siteUrl: string;
}

export function InvitationsList({ invitations, siteUrl }: InvitationsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setLoadingId(id);
    await revokeInvitation(id);
    setLoadingId(null);
  };

  const handleResend = async (id: string) => {
    setLoadingId(id);
    await resendInvitation(id);
    setLoadingId(null);
  };

  const copyLink = async (token: string, id: string) => {
    const url = `${siteUrl}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1">
        Invitaciones ({invitations.length})
      </h3>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {invitations.map((inv) => (
          <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 font-medium">{inv.email}</span>
              <StatusBadge status={inv.status === 'pending' && isExpired(inv.expires_at) ? 'expired' : inv.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="capitalize">{inv.role.replace(/_/g, ' ')}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(inv.created_at).toLocaleDateString('es-CO', { dateStyle: 'short' })}
              </span>
            </div>
            {inv.status === 'pending' && !isExpired(inv.expires_at) && (
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => copyLink(inv.token, inv.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-sky-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {copiedId === inv.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === inv.id ? 'Copiado' : 'Copiar link'}
                </button>
                <button
                  onClick={() => handleResend(inv.id)}
                  disabled={loadingId === inv.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingId === inv.id ? 'animate-spin' : ''}`} />
                  Reenviar
                </button>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  disabled={loadingId === inv.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Revocar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-700">{inv.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                    {inv.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inv.status === 'pending' && isExpired(inv.expires_at) ? 'expired' : inv.status} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {new Date(inv.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                </td>
                <td className="px-4 py-3 text-right">
                  {inv.status === 'pending' && !isExpired(inv.expires_at) && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copyLink(inv.token, inv.id)}
                        className="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Copiar link de invitacion"
                      >
                        {copiedId === inv.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleResend(inv.id)}
                        disabled={loadingId === inv.id}
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Reenviar invitacion"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingId === inv.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        disabled={loadingId === inv.id}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Revocar invitacion"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
