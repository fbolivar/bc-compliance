'use client';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  colorClass: string;
}

/**
 * Thin progress bar with a dynamic width driven by inline style.
 * Isolated as a client component so the server page stays free of inline styles.
 */
export function ProgressBar({ value, max, label, colorClass }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
        // eslint-disable-next-line react/forbid-component-props
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      />
    </div>
  );
}
