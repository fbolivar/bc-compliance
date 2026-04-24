import { requireOrg } from '@/shared/lib/get-org';
import { getRegulatoryEvents } from '@/features/regulatory-calendar/services/regulatoryEventService';
import { PageHeader } from '@/shared/components/PageHeader';
import { RegulatoryCalendarClient } from '@/features/regulatory-calendar/components/RegulatoryCalendarClient';
import { CalendarDays, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default async function RegulatoryCalendarPage() {
  await requireOrg();
  const events = await getRegulatoryEvents();

  const today = new Date();

  const total = events.length;
  const pending = events.filter((e) => e.status === 'pending').length;
  const overdue = events.filter(
    (e) => e.status === 'pending' && new Date(e.due_date) < today
  ).length;
  const completed = events.filter((e) => e.status === 'completed').length;

  const stats = [
    {
      label: 'Total eventos',
      value: total,
      icon: CalendarDays,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Pendientes',
      value: pending,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Vencidos',
      value: overdue,
      icon: AlertTriangle,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      label: 'Completados',
      value: completed,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
  ];

  // Sort by due_date ASC (upcoming first); overdue items bubble to top via status
  const sorted = [...events].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario Regulatorio"
        description="Obligaciones y plazos regulatorios ante SFC, SIC, MinTIC y otras entidades"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Client component: table + modal */}
      <RegulatoryCalendarClient data={sorted} />
    </div>
  );
}
