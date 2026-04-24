export type CampaignType = 'awareness' | 'compliance' | 'technical' | 'onboarding' | 'phishing_simulation';
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'archived';
export type SessionFormat = 'in_person' | 'online' | 'hybrid' | 'video' | 'document' | 'phishing';
export type EnrollmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'excused';

export interface TrainingCampaign {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  target_audience: string | null;
  due_date: string | null;
  mandatory: boolean;
  iso_clause: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  session_count?: number;
  enrollment_count?: number;
  completion_rate?: number;
}

export interface TrainingSession {
  id: string;
  campaign_id: string | null;
  organization_id: string;
  title: string;
  description: string | null;
  format: SessionFormat;
  scheduled_at: string | null;
  duration_minutes: number | null;
  trainer: string | null;
  location: string | null;
  max_participants: number | null;
  passing_score: number | null;
  created_at: string;
  campaign?: { title: string; type: CampaignType } | null;
  enrollment_count?: number;
  completion_count?: number;
}

export interface TrainingEnrollment {
  id: string;
  session_id: string;
  organization_id: string;
  user_name: string;
  user_email: string;
  department: string | null;
  status: EnrollmentStatus;
  score: number | null;
  completed_at: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  session?: { title: string; format: SessionFormat } | null;
}

export interface TrainingStats {
  activeCampaigns: number;
  completionsThisMonth: number;
  overallCompletionRate: number;
  overdueTrainings: number;
  totalEnrollments: number;
  pendingEnrollments: number;
}
