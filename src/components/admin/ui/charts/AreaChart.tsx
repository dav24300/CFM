"use client";

import { useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type Point = { label: string; value: number };

/**
 * Aire + ligne, gridlines, labels X, tooltip au survol (suivi horizontal).
 * Accent = token `admin-accent`. Tracé animé (path draw) sous reduced-motion.
 */
export function AreaChart({
  data,
  className,
  height = 220,
  valueFormat = (n) => String(n),
}: {
  data: Point[];
  className?: string;
  height?: number;
  valueFormat?: (n: number) => string;
}) {
  const id = useId();
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  if (!data || data.length < 2) return null;

  const W = 600;
  const H = 200;
  const padT = 8;
  const padB = 8;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xy = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = padT + (1 - (d.value - min) / span) * (H - padT - padB);
    return [x, y] as const;
  });
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + t * (H - padT - padB));
  const xLabels =
    data.length <= 8
      ? data.map((_, i) => i)
      : [0, Math.floor(data.length / 3), Math.floor((2 * data.length) / 3), data.length - 1];

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))));
  }

  return (
    <div
      ref={wrapRef}
      className={cn("relative", className)}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} className="w-full">
        {gridY.map((y, i) => (
          <line
            key={i}
            x1="0"
            x2={W}
            y1={y}
            y2={y}
            className="stroke-admin-border"
            strokeWidth="1"
            strokeDasharray="3 5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <defs>
          <linearGradient id={`ac-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} className="text-admin-accent" fill={`url(#ac-${id})`} />
        <motion.path
          d={line}
          className="text-admin-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={reduced ? undefined : { pathLength: 0 }}
          animate={reduced ? undefined : { pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        {hover !== null && (
          <>
            <line
              x1={xy[hover][0]}
              x2={xy[hover][0]}
              y1={padT}
              y2={H}
              className="stroke-admin-accent/40"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={xy[hover][0]}
              cy={xy[hover][1]}
              r="4.5"
              className="fill-admin-surface stroke-admin-accent"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      <div className="mt-1.5 flex justify-between text-[10.5px] text-admin-muted-2">
        {xLabels.map((i) => (
          <span key={i}>{data[i].label}</span>
        ))}
      </div>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-admin-ctrl border border-admin-border bg-admin-surface px-2.5 py-1.5 text-[11px] shadow-admin-overlay"
          style={{ left: `${(hover / (data.length - 1)) * 100}%` }}
        >
          <div className="font-display font-semibold text-admin-ink">{valueFormat(data[hover].value)}</div>
          <div className="text-admin-muted-2">{data[hover].label}</div>
        </div>
      )}
    </div>
  );
}
