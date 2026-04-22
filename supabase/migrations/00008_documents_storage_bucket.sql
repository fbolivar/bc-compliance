-- Bucket privado para documentos SGSI (máx 50 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: miembros de la org pueden operar sobre archivos en {org_id}/*
DROP POLICY IF EXISTS "documents_select_org_member" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_org_member" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_org_member" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_org_member" ON storage.objects;

CREATE POLICY "documents_select_org_member" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids()));

CREATE POLICY "documents_insert_org_member" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids()));

CREATE POLICY "documents_delete_org_member" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids()));

CREATE POLICY "documents_update_org_member" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids()));
