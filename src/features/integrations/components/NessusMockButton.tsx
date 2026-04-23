'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { runMockIngest } from '@/features/integrations/actions/ingestActions';

export function NessusMockButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const run = () => {
    if (!confirm('Ejecutar ingesta sintética del conector Nessus? Generará 5 vulnerabilidades de demostración.')) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await runMockIngest();
      if (res.error) {
        setFeedback(`Error: ${res.error}`);
        return;
      }
      setFeedback(`✓ ${res.inserted} nuevas, ${res.updated} actualizadas, ${res.skipped} omitidas`);
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">Conector Nessus (modo demo)</h3>
          <p className="text-xs text-amber-700 mt-0.5">
            Genera vulnerabilidades sintéticas realistas (CVE-2024-3400, CVE-2023-46805, etc.)
            sin necesidad de un Nessus real. Útil para demostraciones y onboarding.
          </p>
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Ejecutar ingesta sintética
          </button>
          {feedback && (
            <p className={`text-xs mt-2 ${feedback.startsWith('Error') ? 'text-rose-700' : 'text-emerald-700'}`}>
              {feedback}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
