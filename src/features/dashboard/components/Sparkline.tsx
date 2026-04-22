import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  values: number[];
  /** Height in px (width is responsive) */
  height?: number;
  color?: string;
  /** Show trend indicator (current vs first value) */
  showTrend?: boolean;
  /** Suffix for trend label (e.g. ' pts', '%') */
  suffix?: string;
}

export function Sparkline({
  values,
  height = 36,
  color = '#0ea5e9',
  showTrend = true,
  suffix = '',
}: Props) {
  if (values.length < 2) {
    return <div className="text-[10px] text-slate-400 italic">Sin datos históricos</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 120;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const path = `M ${points.join(' L ')}`;
  const fillPath = `${path} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  const current = values[values.length - 1];
  const first = values[0];
  const delta = current - first;
  const direction = delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat';

  const trendColor = direction === 'up' ? 'text-emerald-600' : direction === 'down' ? 'text-rose-600' : 'text-slate-400';
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const sign = delta > 0 ? '+' : '';

  return (
    <div className="flex items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <path d={fillPath} fill={color} fillOpacity="0.1" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Last point dot */}
        <circle
          cx={Number(points[points.length - 1].split(',')[0])}
          cy={Number(points[points.length - 1].split(',')[1])}
          r="2.5"
          fill={color}
        />
      </svg>
      {showTrend && (
        <div className={`flex items-center gap-0.5 text-[11px] font-medium ${trendColor}`}>
          <Icon className="w-3 h-3" />
          <span className="tabular-nums">{sign}{delta.toFixed(0)}{suffix}</span>
        </div>
      )}
    </div>
  );
}
