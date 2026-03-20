import { requireOrg } from '@/shared/lib/get-org';
import { getDocuments } from '@/features/documents/services/documentService';
import { DocumentList } from '@/features/documents/components/DocumentList';
import { PageHeader } from '@/shared/components/PageHeader';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ page?: string; status?: string; document_type?: string }>;
}

export default async function DocumentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getDocuments(orgId, { page, pageSize: 25 }, {
    status: params.status,
    document_type: params.document_type,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion Documental"
        description="Politicas, procedimientos, estandares y registros"
        actions={
          <Link
            href="/documents/evidence"
            className="px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:border-slate-600 hover:text-white transition-colors"
          >
            Ver Evidencias
          </Link>
        }
      />
      <DocumentList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
