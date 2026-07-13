"use client";

import { cn } from "@/lib/utils/cn";

type Option<T extends string> = { value: T; label: string };

/** Sélecteur segmenté (pills) — période, filtres. Actif = surface surélevée. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-admin-ctrl border border-admin-border bg-admin-bg p-0.5",
        className
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={cn(
              "rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              on
                ? "bg-admin-surface text-admin-ink shadow-admin-rest"
                : "text-admin-muted hover:text-admin-ink"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
