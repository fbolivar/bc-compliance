'use client';

import { LogOut } from 'lucide-react';
import { signout } from '@/actions/auth';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signout()}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
      title="Cerrar sesion"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
