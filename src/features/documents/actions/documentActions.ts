'use server';

import { createEntity, updateEntity, deleteEntity, type ActionResult } from '@/shared/lib/actions-helpers';

const FIELDS = [
  'code', 'name', 'description', 'document_type', 'category',
  'status', 'version', 'author', 'owner',
  'review_date', 'expiry_date', 'file_url',
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
