"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Sparkline } from "./charts/Sparkline";

/**
 * Carte KPI premium : icône + libellé + valeur (count-up) + delta % ↑/↓ + sparkline.
 * Couleurs de tendance via tokens admin (ok = vert / danger = rouge).
 */
export function StatCard({
  label,
  value,
  format,
  delta,
  spark,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  /** Variation en % (signée). ↑ vert / ↓ rouge. */
  delta?: number;
  /** Série pour la sparkline. */
  spark?: number[];
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const trendColor = up ? "text-admin-ok-fg" : "text-admin-danger-fg";

  return (
    <div
      className={cn(
        "rounded-admin-card border border-admin-border bg-admin-surface p-5 shadow-admin-rest transition-shadow duration-200 hover:shadow-admin-raised",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-admin-muted">{label}</span>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-admin-ctrl bg-admin-accent/10 text-admin-accent">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <span className="font-display text-admin-display font-bold leading-none tracking-[-0.01em] text-admin-ink">
          <AnimatedNumber value={value} format={format} />
        </span>
        {spark && spark.length > 1 && (
          <span className={cn("h-8 w-20 shrink-0", trendColor)}>
            <Sparkline data={spark} className="h-full w-full" />
          </span>
        )}
      </div>

      {delta !== undefined && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px]">
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", trendColor)}>
            {up ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden />
            )}
            {up ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
          <span className="text-admin-muted-2">vs période préc.</span>
        </div>
      )}
    </div>
  );
}
