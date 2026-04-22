import { NextResponse } from 'next/server';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id, attachmentId } = await params;
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Verify document ownership
  const { data: doc } = await supabase
    .from('documents')
    .select('organization_id')
    .eq('id', id)
    .single();
  if (!doc || doc.organization_id !== orgId) {
    return new NextResponse('Sin permisos', { status: 403 });
  }

  // Fetch attachment
  const { data: att } = await supabase
    .from('document_attachments')
    .select('file_path, file_name, mime_type')
    .eq('id', attachmentId)
    .eq('document_id', id)
    .single();
  if (!att) return new NextResponse('Adjunto no encontrado', { status: 404 });

  const { data: signed, error: signErr } = await supabase.storage
    .from('documents')
    .createSignedUrl(att.file_path, 60);
  if (signErr || !signed) {
    return new NextResponse(`Error generando enlace: ${signErr?.message ?? 'unknown'}`, { status: 500 });
  }

  const res = await fetch(signed.signedUrl);
  if (!res.ok) return new NextResponse('Error descargando', { status: 500 });
  const arr = await res.arrayBuffer();

  return new NextResponse(arr, {
    headers: {
      'Content-Type': att.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${att.file_name}"`,
      'Cache-Control': 'no-store',
    },
  });
}
