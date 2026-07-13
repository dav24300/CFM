"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

/**
 * Jauge radiale (demi-cercle). `value` 0–100, arc de valeur animé (pathLength).
 * Couleur d'arc par token (défaut vert `admin-ok-fg`).
 */
export function RadialGauge({
  value,
  label,
  arcClass = "stroke-admin-ok-fg",
  className,
}: {
  value: number;
  label?: string;
  arcClass?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));
  const R = 78;
  const CX = 100;
  const CY = 100;
  const sw = 16;
  const arc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg viewBox="0 0 200 116" className="w-full max-w-[220px]">
        <path d={arc} fill="none" className="stroke-admin-border" strokeWidth={sw} strokeLinecap="round" />
        <motion.path
          d={arc}
          fill="none"
          className={arcClass}
          strokeWidth={sw}
          strokeLinecap="round"
          initial={reduced ? { pathLength: pct / 100 } : { pathLength: 0 }}
          animate={{ pathLength: pct / 100 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          className="fill-admin-ink font-display font-bold"
          style={{ fontSize: "30px" }}
        >
          {Math.round(pct)}%
        </text>
      </svg>
      {label && <p className="-mt-1 text-center text-[12.5px] text-admin-muted">{label}</p>}
    </div>
  );
}
