import { createClient } from '@/lib/supabase/server';
import type {
  TrainingCampaign,
  TrainingSession,
  TrainingEnrollment,
  TrainingStats,
} from '../types/training';

export async function getTrainingCampaigns(orgId: string): Promise<TrainingCampaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('training_campaigns')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingCampaign[];
}

export async function getTrainingSessions(orgId: string): Promise<TrainingSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, campaign:training_campaigns(title, type)')
    .eq('organization_id', orgId)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingSession[];
}

export async function getTrainingEnrollments(orgId: string): Promise<TrainingEnrollment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('training_enrollments')
    .select('*, session:training_sessions(title, format)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as TrainingEnrollment[];
}

export async function getTrainingStats(orgId: string): Promise<TrainingStats> {
  const supabase = await createClient();

  const [campaignsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('training_campaigns')
      .select('status, due_date')
      .eq('organization_id', orgId),
    supabase
      .from('training_enrollments')
      .select('status, completed_at')
      .eq('organization_id', orgId),
  ]);

  const campaigns = campaignsRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const completionsThisMonth = enrollments.filter(
    e => e.status === 'completed' && e.completed_at && e.completed_at >= startOfMonth
  ).length;
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending' || e.status === 'in_progress').length;
  const overallCompletionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;
  const overdueTrainings = campaigns.filter(
    c => c.status === 'active' && c.due_date && new Date(c.due_date) < now
  ).length;

  return {
    activeCampaigns,
    completionsThisMonth,
    overallCompletionRate,
    overdueTrainings,
    totalEnrollments,
    pendingEnrollments,
  };
}
