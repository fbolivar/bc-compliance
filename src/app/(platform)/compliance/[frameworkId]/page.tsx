import { requireOrg } from '@/shared/lib/get-org';
import {
  getFrameworkById,
  getFrameworkRequirements,
} from '@/features/compliance/services/complianceService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ frameworkId: string }>;
}

export default async function FrameworkDetailPage({ params }: Props) {
  const { frameworkId } = await params;
  await requireOrg();

  const framework = await getFrameworkById(frameworkId);
  if (!framework) notFound();

  const requirements = await getFrameworkRequirements(frameworkId);

  // Group by section
  const sections = requirements.reduce<Record<string, typeof requirements>>((acc, req) => {
    const section = req.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(req);
    return acc;
  }, {});

  const sectionKeys = Object.keys(sections).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/compliance" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={framework.name}
          description={`${framework.version || ''} | ${requirements.length} requisitos totales`}
        />
      </div>

      {sectionKeys.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 py-16 text-center">
          <p className="text-sm text-slate-500">No hay requisitos registrados para este framework</p>
        </div>
      ) : (
        sectionKeys.map((section) => (
          <div key={section} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
              <h2 className="text-sm font-semibold text-slate-300">{section}</h2>
              <p className="text-xs text-slate-500">{sections[section].length} requisitos</p>
            </div>
            <div className="divide-y divide-slate-800/50">
              {sections[section].map((req) => (
                <div key={req.id} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs text-cyan-400 w-20 shrink-0 mt-0.5">{req.code}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{req.title}</p>
                      {req.description && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{req.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {req.is_mandatory && (
                        <span className="px-1.5 py-0.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                          Obligatorio
                        </span>
                      )}
                      {req.compliance_status && <StatusBadge status={req.compliance_status} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
