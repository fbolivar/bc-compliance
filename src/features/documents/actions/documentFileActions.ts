'use server';

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserOrgId } from '@/shared/lib/actions-helpers';
import { writeAuditLog } from '@/shared/lib/audit';

export type ActionResult = {
  success?: boolean;
  error?: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 200);
}

export async function uploadDocumentFile(documentId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Selecciona un archivo' };
  if (file.size > MAX_FILE_SIZE) return { error: `Archivo excede 50 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)` };

  // Verify document belongs to org
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, organization_id, file_path')
    .eq('id', documentId)
    .single();
  if (docErr || !doc) return { error: 'Documento no encontrado' };
  if (doc.organization_id !== orgId) return { error: 'Sin permisos para este documento' };

  // Compute SHA-256 hash
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = createHash('sha256').update(buffer).digest('hex');

  // Delete previous file if exists
  if (doc.file_path) {
    await supabase.storage.from('documents').remove([doc.file_path]);
  }

  // Upload with path convention {org_id}/{document_id}/{filename}
  const safeName = sanitizeFilename(file.name);
  const path = `${orgId}/${documentId}/${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from('documents')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });
  if (uploadErr) return { error: `Error subiendo archivo: ${uploadErr.message}` };

  // Update document record
  const { error: updateErr } = await supabase
    .from('documents')
    .update({
      file_path: path,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      hash_sha256: hash,
      updated_by: user.id,
    })
    .eq('id', documentId);
  if (updateErr) return { error: updateErr.message };

  await writeAuditLog({
    action: 'update',
    tableName: 'documents',
    recordId: documentId,
    description: `Archivo subido: ${safeName} (${(file.size / 1024).toFixed(1)} KB)`,
  });

  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}

export async function removeDocumentFile(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = await getUserOrgId();
  if (!orgId) return { error: 'Sin organizacion' };

  const { data: doc } = await supabase
    .from('documents')
    .select('id, organization_id, file_path')
    .eq('id', documentId)
    .single();
  if (!doc) return { error: 'Documento no encontrado' };
  if (doc.organization_id !== orgId) return { error: 'Sin permisos' };
  if (!doc.file_path) return { success: true };

  await supabase.storage.from('documents').remove([doc.file_path]);

  await supabase
    .from('documents')
    .update({
      file_path: null,
      file_size: null,
      mime_type: null,
      hash_sha256: null,
      updated_by: user.id,
    })
    .eq('id', documentId);

  await writeAuditLog({
    action: 'delete',
    tableName: 'documents',
    recordId: documentId,
    description: 'Archivo eliminado del documento',
  });

  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}
