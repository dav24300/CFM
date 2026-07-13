"use client";

import { cn } from "@/lib/utils/cn";

type Segment = { label: string; value: number; colorClass: string };

/**
 * Donut SVG à segments (technique stroke-dasharray). Couleurs par token
 * (`colorClass` = `stroke-admin-*`). Centre = total + libellé optionnel.
 */
export function Donut({
  segments,
  size = 132,
  thickness = 18,
  centerLabel,
  className,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={R} fill="none" className="stroke-admin-border" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const dash = (s.value / total) * C;
            const node = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={R}
                fill="none"
                className={s.colorClass}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, dash - 2)} ${C - Math.max(0, dash - 2)}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return node;
          })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-admin-h2 font-bold text-admin-ink">{centerLabel}</span>
          </div>
        )}
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-[12.5px]">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-admin-muted">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", s.colorClass.replace("stroke-", "bg-"))} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="font-semibold text-admin-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
