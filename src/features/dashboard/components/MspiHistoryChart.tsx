'use client';

import type { MspiSnapshot } from '../services/executiveDashboardService';

interface Props {
  history: MspiSnapshot[];
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function maturityColor(score: number): string {
  if (score >= 80) return '#10b981'; // optimizado
  if (score >= 60) return '#3b82f6'; // gestionado
  if (score >= 40) return '#f59e0b'; // definido
  if (score >= 20) return '#f97316'; // repetible
  return '#ef4444';                  // inicial/inexistente
}

export function MspiHistoryChart({ history }: Props) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 text-xs text-slate-400">
        Historial disponible después del primer mes de uso
      </div>
    );
  }

  const W = 600;
  const H = 120;
  const PAD = { top: 12, right: 16, bottom: 28, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const scores = history.map(s => s.score);
  const minScore = Math.max(0, Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);
  const range = maxScore - minScore || 10;

  const toX = (i: number) => PAD.left + (i / (history.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minScore) / range) * chartH;

  const points = history.map((s, i) => ({ x: toX(i), y: toY(s.score), score: s.score, date: s.snapshot_date }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Area fill path
  const areaPath = [
    `M ${points[0].x},${PAD.top + chartH}`,
    ...points.map(p => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${PAD.top + chartH}`,
    'Z',
  ].join(' ');

  // Sample month labels (show up to 6 evenly spaced)
  const labelIndices = history.length <= 6
    ? history.map((_, i) => i)
    : Array.from({ length: 6 }, (_, i) => Math.round(i * (history.length - 1) / 5));

  const lastScore = history[history.length - 1].score;
  const firstScore = history[0].score;
  const delta = lastScore - firstScore;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-600">Evolución MSPI — últimos 6 meses</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: maturityColor(lastScore) }}>
            {lastScore} pts
          </span>
          {delta !== 0 && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {delta > 0 ? '+' : ''}{delta} pts
            </span>
          )}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: `${H}px`, maxHeight: `${H}px` }}
        aria-label="Gráfico histórico MSPI"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          if (v < minScore - 5 || v > maxScore + 5) return null;
          const y = toY(v);
          if (y < PAD.top || y > PAD.top + chartH) return null;
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
              <text x={PAD.left - 4} y={y + 3.5} textAnchor="end"
                fontSize="8" fill="#94a3b8">{v}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <defs>
          <linearGradient id="mspiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={maturityColor(lastScore)} stopOpacity="0.18" />
            <stop offset="100%" stopColor={maturityColor(lastScore)} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#mspiGrad)" />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={maturityColor(lastScore)}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3"
            fill="white" stroke={maturityColor(p.score)} strokeWidth="2" />
        ))}

        {/* Month labels */}
        {labelIndices.map(i => {
          const snap = history[i];
          const date = new Date(snap.snapshot_date + 'T00:00:00');
          const label = MONTH_LABELS[date.getMonth()];
          return (
            <text key={i} x={toX(i)} y={H - 4} textAnchor="middle"
              fontSize="9" fill="#94a3b8">{label}</text>
          );
        })}
      </svg>
    </div>
  );
}
