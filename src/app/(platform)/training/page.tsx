import { requireOrg } from '@/shared/lib/get-org';
import {
  getTrainingCampaigns,
  getTrainingSessions,
  getTrainingEnrollments,
  getTrainingStats,
} from '@/features/training/services/trainingService';
import { TrainingClient } from '@/features/training/components/TrainingClient';
import { PageHeader } from '@/shared/components/PageHeader';
import { GraduationCap, BookOpen, UserCheck, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function TrainingPage({ searchParams }: Props) {
  const { orgId } = await requireOrg();
  const { tab } = await searchParams;

  const [campaigns, sessions, enrollments, stats] = await Promise.all([
    getTrainingCampaigns(orgId),
    getTrainingSessions(orgId),
    getTrainingEnrollments(orgId),
    getTrainingStats(orgId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formación y Concienciación"
        description="ISO 27001:2022 A.6.3 · Campañas de capacitación, seguimiento de completitud y métricas de cumplimiento"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Campañas Activas</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.activeCampaigns}</p>
          <p className="text-xs text-slate-400 mt-0.5">en progreso</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.completionsThisMonth}</p>
          <p className="text-xs text-slate-400 mt-0.5">este mes</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completitud Global</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.overallCompletionRate}%</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.totalEnrollments} participantes</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vencidas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.overdueTrainings}</p>
          <p className="text-xs text-slate-400 mt-0.5">campañas vencidas</p>
        </div>
      </div>

      <TrainingClient
        campaigns={campaigns}
        sessions={sessions}
        enrollments={enrollments}
        activeTab={tab ?? 'campanas'}
      />
    </div>
  );
}
