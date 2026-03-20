'use client';

import { useState } from 'react';
import { toggleMemberStatus, removeMember } from '@/actions/members';
import { UserX, UserCheck, Trash2, MoreVertical } from 'lucide-react';

interface MemberActionsProps {
  memberId: string;
  isOwner: boolean;
  isActive: boolean;
}

export function MemberActions({ memberId, isOwner, isActive }: MemberActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (isOwner) return <span className="text-xs text-slate-400">-</span>;

  const handleToggle = async () => {
    setLoading(true);
    await toggleMemberStatus(memberId);
    setLoading(false);
    setShowMenu(false);
  };

  const handleRemove = async () => {
    if (!confirm('Estas seguro de eliminar este miembro?')) return;
    setLoading(true);
    await removeMember(memberId);
    setLoading(false);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-[fadeIn_0.1s_ease-out]">
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {isActive ? (
                <>
                  <UserX className="w-4 h-4 text-amber-500" />
                  Desactivar
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  Activar
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar miembro
            </button>
          </div>
        </>
      )}
    </div>
  );
}
