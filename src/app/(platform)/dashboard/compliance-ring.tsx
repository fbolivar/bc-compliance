'use client';

interface ComplianceRingProps {
  value: number;
  color: string;
}

/**
 * Renders a conic-gradient progress ring around a compliance percentage.
 * Isolated as a client component so the dynamic `style` prop (conic-gradient)
 * lives here and the parent server component stays free of inline styles.
 */
export function ComplianceRing({ value, color }: ComplianceRingProps) {
  const deg = value * 3.6;
  const gradient = `conic-gradient(${color} ${deg}deg, rgba(30,41,59,0.5) 0deg)`;

  return (
    <span
      className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full flex items-center justify-center"
      // eslint-disable-next-line react/forbid-component-props
      style={{ background: gradient }}
      aria-hidden="true"
    >
      <span className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-900 flex items-center justify-center">
        <span className="text-lg sm:text-xl font-bold text-white">{value}%</span>
      </span>
    </span>
  );
}
