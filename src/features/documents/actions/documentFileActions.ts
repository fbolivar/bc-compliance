'use server';

import { createHash, randomUUID } from 'crypto';
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

/**
 * Sube un archivo como attachment (múltiples archivos por documento).
 */
export async function uploadDocumentAttachment(
  documentId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const orgId = await getUserOrgId();
    if (!orgId) return { error: 'Sin organización activa' };

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) return { error: 'Selecciona un archivo válido' };
    if (file.size > MAX_FILE_SIZE) {
      return { error: `Archivo excede 50 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)` };
    }

    const description = (formData.get('description') as string | null) ?? null;

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, organization_id')
      .eq('id', documentId)
      .single();
    if (docErr || !doc) return { error: 'Documento no encontrado' };
    if (doc.organization_id !== orgId) return { error: 'Sin permisos para este documento' };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash('sha256').update(buffer).digest('hex');

    const safeName = sanitizeFilename(file.name) || `archivo_${Date.now()}`;
    const uniquePrefix = randomUUID().substring(0, 8);
    const path = `${orgId}/${documentId}/attachments/${uniquePrefix}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (uploadErr) {
      console.error('[uploadDocumentAttachment] storage error:', uploadErr);
      return { error: `Error subiendo a Storage: ${uploadErr.message}` };
    }

    const { error: insertErr } = await supabase
      .from('document_attachments')
      .insert({
        document_id: documentId,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        hash_sha256: hash,
        description: description?.trim() || null,
        uploaded_by: user.id,
      });
    if (insertErr) {
      // Roll back storage upload on DB failure
      await supabase.storage.from('documents').remove([path]);
      console.error('[uploadDocumentAttachment] insert error:', insertErr);
      return { error: `Archivo subido pero no registrado: ${insertErr.message}` };
    }

    await writeAuditLog({
      action: 'create',
      tableName: 'document_attachments',
      description: `Adjunto cargado en documento ${documentId}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    });

    revalidatePath(`/documents/${documentId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[uploadDocumentAttachment] unexpected:', err);
    return { error: `Error inesperado: ${msg}` };
  }
}

export async function removeDocumentAttachment(attachmentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: att } = await supabase
      .from('document_attachments')
      .select('id, document_id, file_path')
      .eq('id', attachmentId)
      .single();
    if (!att) return { error: 'Adjunto no encontrado' };

    const { error: removeErr } = await supabase.storage.from('documents').remove([att.file_path]);
    if (removeErr) console.warn('[removeDocumentAttachment] storage remove warn:', removeErr);

    const { error: delErr } = await supabase
      .from('document_attachments')
      .delete()
      .eq('id', attachmentId);
    if (delErr) return { error: delErr.message };

    await writeAuditLog({
      action: 'delete',
      tableName: 'document_attachments',
      recordId: attachmentId,
      description: `Adjunto eliminado del documento ${att.document_id}`,
    });

    revalidatePath(`/documents/${att.document_id}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[removeDocumentAttachment] unexpected:', err);
    return { error: `Error inesperado: ${msg}` };
  }
}
