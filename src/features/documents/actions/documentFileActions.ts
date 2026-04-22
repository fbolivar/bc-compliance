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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const orgId = await getUserOrgId();
    if (!orgId) return { error: 'Sin organizacion activa' };

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) return { error: 'Selecciona un archivo válido' };
    if (file.size > MAX_FILE_SIZE) {
      return { error: `Archivo excede 50 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)` };
    }

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, organization_id, file_path')
      .eq('id', documentId)
      .single();
    if (docErr) {
      console.error('[uploadDocumentFile] doc fetch error:', docErr);
      return { error: `No se pudo cargar el documento: ${docErr.message}` };
    }
    if (!doc) return { error: 'Documento no encontrado' };
    if (doc.organization_id !== orgId) return { error: 'Sin permisos para este documento' };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash('sha256').update(buffer).digest('hex');

    if (doc.file_path) {
      const { error: removeErr } = await supabase.storage.from('documents').remove([doc.file_path]);
      if (removeErr) console.warn('[uploadDocumentFile] previous file remove warn:', removeErr);
    }

    const safeName = sanitizeFilename(file.name) || `archivo_${Date.now()}`;
    const path = `${orgId}/${documentId}/${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });
    if (uploadErr) {
      console.error('[uploadDocumentFile] storage upload error:', uploadErr);
      return { error: `Error subiendo a Storage: ${uploadErr.message}` };
    }

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
    if (updateErr) {
      console.error('[uploadDocumentFile] document update error:', updateErr);
      return { error: `Archivo subido pero no se pudo actualizar el registro: ${updateErr.message}` };
    }

    await writeAuditLog({
      action: 'update',
      tableName: 'documents',
      recordId: documentId,
      description: `Archivo subido: ${safeName} (${(file.size / 1024).toFixed(1)} KB)`,
    });

    revalidatePath(`/documents/${documentId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[uploadDocumentFile] unexpected:', err);
    return { error: `Error inesperado: ${msg}` };
  }
}

export async function removeDocumentFile(documentId: string): Promise<ActionResult> {
  try {
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

    const { error: removeErr } = await supabase.storage.from('documents').remove([doc.file_path]);
    if (removeErr) console.warn('[removeDocumentFile] storage remove warn:', removeErr);

    const { error: updateErr } = await supabase
      .from('documents')
      .update({
        file_path: null,
        file_size: null,
        mime_type: null,
        hash_sha256: null,
        updated_by: user.id,
      })
      .eq('id', documentId);
    if (updateErr) return { error: updateErr.message };

    await writeAuditLog({
      action: 'delete',
      tableName: 'documents',
      recordId: documentId,
      description: 'Archivo eliminado del documento',
    });

    revalidatePath(`/documents/${documentId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[removeDocumentFile] unexpected:', err);
    return { error: `Error inesperado: ${msg}` };
  }
}
