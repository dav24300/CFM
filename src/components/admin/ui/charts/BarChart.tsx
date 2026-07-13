"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type Bar = { label: string; value: number };

/**
 * Bar chart vertical, une barre mise en avant (accent), les autres en sourdine.
 * Barres qui grandissent (scaleY) sous reduced-motion.
 */
export function BarChart({
  data,
  highlightIndex,
  className,
  valueFormat = (n) => String(n),
}: {
  data: Bar[];
  highlightIndex?: number;
  className?: string;
  valueFormat?: (n: number) => string;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(...data.map((d) => d.value)) || 1;

  return (
    <div className={cn("flex items-end justify-between gap-2", className)}>
      {data.map((d, i) => {
        const on = i === highlightIndex;
        const h = Math.max(4, (d.value / max) * 100);
        return (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="relative flex h-28 w-full items-end justify-center">
              {on && (
                <span className="absolute -top-1 whitespace-nowrap rounded-admin-ctrl bg-admin-ink px-1.5 py-0.5 text-[10px] font-semibold text-admin-surface">
                  {valueFormat(d.value)}
                </span>
              )}
              <motion.span
                className={cn(
                  "w-full max-w-[26px] rounded-t-md",
                  on ? "bg-admin-accent" : "bg-admin-accent/15"
                )}
                style={{ height: `${h}%`, transformOrigin: "bottom" }}
                initial={reduced ? { scaleY: 1 } : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: reduced ? 0 : i * 0.04 }}
              />
            </div>
            <span className={cn("text-[11px]", on ? "font-semibold text-admin-ink" : "text-admin-muted-2")}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
