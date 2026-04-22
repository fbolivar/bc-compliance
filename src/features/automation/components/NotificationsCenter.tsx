'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Filter,
} from 'lucide-react';
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  generateSystemAlerts,
} from '@/features/automation/actions/notificationActions';
import type { NotificationRow } from '@/features/automation/services/notificationService';

interface Props {
  items: NotificationRow[];
  unreadCount: number;
}

const ICONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  critical: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  info: { icon: <Info className="w-4 h-4" />, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
};

function iconFor(type: string) {
  return ICONS[type] ?? ICONS.info;
}

function entityHrefFor(type: string | null, id: string | null): string | null {
  if (!type || !id) return null;
  switch (type) {
    case 'risk_scenario': return `/risks/${id}`;
    case 'control': return `/controls/${id}`;
    case 'vulnerability': return `/vulnerabilities/${id}`;
    case 'incident': return `/incidents/${id}`;
    case 'nonconformity': return `/nonconformities/${id}`;
    case 'asset': return `/assets/${id}`;
    default: return null;
  }
}

export function NotificationsCenter({ items }: Props) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter === 'unread' && n.is_read) return false;
      if (filter === 'read' && !n.is_read) return false;
      if (typeFilter !== 'all' && n.notification_type !== typeFilter) return false;
      return true;
    });
  }, [items, filter, typeFilter]);

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res.error) alert(res.error);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    startTransition(async () => {
      await deleteNotification(id);
    });
  };

  const handleGenerate = () => {
    if (!confirm('Generar alertas del sistema basadas en el estado actual? (riesgos críticos sin controles, vulns críticas abiertas, NCs próximas a vencer, incidentes abiertos).')) return;
    startTransition(async () => {
      const res = await generateSystemAlerts();
      if (res.error) {
        alert(res.error);
        return;
      }
      alert(`${res.created ?? 0} notificaciones generadas.`);
      window.location.reload();
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
          {([
            { v: 'all', label: 'Todas' },
            { v: 'unread', label: 'No leídas' },
            { v: 'read', label: 'Leídas' },
          ] as const).map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setFilter(t.v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === t.v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="w-3.5 h-3.5" />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filtrar por tipo"
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Todos los tipos</option>
          <option value="critical">Críticas</option>
          <option value="warning">Advertencias</option>
          <option value="info">Informativas</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-60 transition-colors"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generar alertas
          </button>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas leídas
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {items.length === 0
                ? 'No hay notificaciones. Haz clic en "Generar alertas" para crear avisos basados en el estado actual.'
                : 'Ninguna notificación coincide con los filtros.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => {
              const meta = iconFor(n.notification_type);
              const href = entityHrefFor(n.entity_type, n.entity_id);
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${n.is_read ? '' : 'bg-sky-50/40'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color} border`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm ${n.is_read ? 'text-slate-500' : 'font-semibold text-slate-800'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" aria-hidden="true" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>{new Date(n.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {href && (
                        <Link href={href} className="text-sky-600 hover:text-sky-700 font-medium">
                          Ver entidad →
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        disabled={pending}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                        title="Marcar como leída"
                        aria-label="Marcar como leída"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      disabled={pending}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                      title="Eliminar"
                      aria-label="Eliminar notificación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
