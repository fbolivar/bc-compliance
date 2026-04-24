import { requireOrg } from '@/shared/lib/get-org';
import { getPolicies } from '@/features/policies/services/policyService';
import { PageHeader } from '@/shared/components/PageHeader';
import { PoliciesClient } from '@/features/policies/components/PoliciesClient';
import { FileText, CheckCircle, Clock, FileEdit } from 'lucide-react';

export default async function PoliciesPage() {
  await requireOrg();

  const [all, approved, review, draft] = await Promise.all([
    getPolicies(1, 200),
    getPolicies(1, 200, 'approved'),
    getPolicies(1, 200, 'review'),
    getPolicies(1, 200, 'draft'),
  ]);

  const stats = [
    {
      label: 'Total documentos',
      value: all.total,
      icon: FileText,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Aprobadas',
      value: approved.total,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'En revisión',
      value: review.total,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Borradores',
      value: draft.total,
      icon: FileEdit,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Políticas y Procedimientos"
        description="Gestión del ciclo de vida de políticas corporativas"
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

      {/* Client component handles the table + create modal */}
      <PoliciesClient data={all.data} />
    </div>
  );
}
