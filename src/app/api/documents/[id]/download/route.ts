import { NextResponse } from 'next/server';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Verify ownership + get file_path
  const { data: doc, error } = await supabase
    .from('documents')
    .select('organization_id, file_path, mime_type, title')
    .eq('id', id)
    .single();

  if (error || !doc) {
    return new NextResponse('Documento no encontrado', { status: 404 });
  }
  if (doc.organization_id !== orgId) {
    return new NextResponse('Sin permisos', { status: 403 });
  }
  if (!doc.file_path) {
    return new NextResponse('Sin archivo adjunto', { status: 404 });
  }

  // Use signed URL (bucket is private)
  const { data: signed, error: signErr } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 60); // 60s

  if (signErr || !signed) {
    return new NextResponse(`Error generando enlace: ${signErr?.message ?? 'unknown'}`, { status: 500 });
  }

  // Fetch and stream
  const res = await fetch(signed.signedUrl);
  if (!res.ok) {
    return new NextResponse('Error descargando archivo', { status: 500 });
  }

  const arr = await res.arrayBuffer();
  const filename = doc.file_path.split('/').pop() ?? `${doc.title || 'documento'}`;

  return new NextResponse(arr, {
    headers: {
      'Content-Type': doc.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
