'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'title', 'description', 'document_type', 'category',
  'status', 'version',
  'confidentiality', 'department',
  'review_date', 'expiry_date', 'retention_period_months',
  'file_path', 'mime_type',
];

export async function createDocument(formData: FormData): Promise<ActionResult> {
  return createEntity('documents', formData, FIELDS, '/documents');
}

export async function updateDocument(id: string, formData: FormData): Promise<ActionResult> {
  return updateEntity('documents', id, formData, FIELDS, '/documents');
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  return deleteEntity('documents', id, '/documents');
}
