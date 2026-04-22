'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { setActiveOrg } from '@/actions/org-switch';
import type { OrgMembership } from '@/shared/lib/get-org';

interface Props {
  current: OrgMembership;
  memberships: OrgMembership[];
}

export function OrgSwitcher({ current, memberships }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Solo se muestra si el user pertenece a más de una org
  if (memberships.length <= 1) return null;

  const handleSwitch = (orgId: string) => {
    if (orgId === current.id) {
      setOpen(false);
      return;
    }
    setSwitchingId(orgId);
    startTransition(async () => {
      const res = await setActiveOrg(orgId);
      setSwitchingId(null);
      setOpen(false);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        aria-label="Cambiar organización activa"
      >
        <Building2 className="w-3.5 h-3.5 text-slate-400" />
        <span className="max-w-[180px] truncate">{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Cambiar organización
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {memberships.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => handleSwitch(m.id)}
                  disabled={pending}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors hover:bg-slate-50 disabled:opacity-50 ${
                    m.id === current.id ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className={`w-4 h-4 flex-shrink-0 ${
                      m.id === current.id ? 'text-sky-600' : 'text-slate-400'
                    }`} />
                    <div className="min-w-0">
                      <p className={`truncate ${m.id === current.id ? 'font-semibold text-sky-700' : 'text-slate-700'}`}>
                        {m.name}
                      </p>
                      {m.is_platform_owner && (
                        <p className="text-[10px] text-amber-600 uppercase tracking-wider">Platform Owner</p>
                      )}
                    </div>
                  </div>
                  {switchingId === m.id ? (
                    <Loader2 className="w-4 h-4 text-sky-500 animate-spin flex-shrink-0" />
                  ) : m.id === current.id ? (
                    <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
