-- Permitir múltiples archivos por documento
CREATE TABLE IF NOT EXISTS document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  hash_sha256 TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_attachments_document ON document_attachments(document_id);

ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_attachments_select ON document_attachments;
DROP POLICY IF EXISTS document_attachments_insert ON document_attachments;
DROP POLICY IF EXISTS document_attachments_update ON document_attachments;
DROP POLICY IF EXISTS document_attachments_delete ON document_attachments;

CREATE POLICY document_attachments_select ON document_attachments FOR SELECT USING (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY document_attachments_insert ON document_attachments FOR INSERT WITH CHECK (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY document_attachments_update ON document_attachments FOR UPDATE USING (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY document_attachments_delete ON document_attachments FOR DELETE USING (
  document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT get_user_org_ids())));

-- Migrar archivos legacy (documents.file_path) al nuevo modelo multi-archivo
INSERT INTO document_attachments (document_id, file_path, file_name, file_size, mime_type, hash_sha256)
SELECT
  id,
  file_path,
  COALESCE(substring(file_path from '[^/]+$'), 'archivo'),
  file_size,
  mime_type,
  hash_sha256
FROM documents
WHERE file_path IS NOT NULL
ON CONFLICT DO NOTHING;
