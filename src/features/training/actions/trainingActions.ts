'use server';

import { createEntity, updateEntity, deleteEntity } from '@/shared/lib/actions-helpers';
import type { ActionResult } from '@/shared/lib/actions-helpers';

const CAMPAIGN_FIELDS = [
  'title', 'description', 'type', 'status', 'target_audience',
  'due_date', 'mandatory', 'iso_clause',
];

const SESSION_FIELDS = [
  'campaign_id', 'title', 'description', 'format', 'scheduled_at',
  'duration_minutes', 'trainer', 'location', 'max_participants', 'passing_score',
];

const ENROLLMENT_FIELDS = [
  'session_id', 'user_name', 'user_email', 'department', 'status',
  'score', 'completed_at', 'expiry_date', 'notes',
];

export async function createCampaign(formData: FormData): Promise<ActionResult> {
  return createEntity('training_campaigns', formData, CAMPAIGN_FIELDS, '/training');
}

export async function updateCampaign(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('training_campaigns', id, formData, CAMPAIGN_FIELDS, '/training');
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  return deleteEntity('training_campaigns', id, '/training');
}

export async function createSession(formData: FormData): Promise<ActionResult> {
  return createEntity('training_sessions', formData, SESSION_FIELDS, '/training');
}

export async function updateSession(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('training_sessions', id, formData, SESSION_FIELDS, '/training');
}

export async function deleteSession(id: string): Promise<ActionResult> {
  return deleteEntity('training_sessions', id, '/training');
}

export async function createEnrollment(formData: FormData): Promise<ActionResult> {
  return createEntity('training_enrollments', formData, ENROLLMENT_FIELDS, '/training');
}

export async function updateEnrollment(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('training_enrollments', id, formData, ENROLLMENT_FIELDS, '/training');
}

export async function deleteEnrollment(id: string): Promise<ActionResult> {
  return deleteEntity('training_enrollments', id, '/training');
}
