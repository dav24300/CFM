import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[var(--control-chip-solid)] text-[var(--control-chip-solid-fg)]",
        accent: "bg-[var(--control-accent-soft)] text-[var(--control-accent)]",
        live: "animate-live-pulse bg-[var(--control-live)] text-white",
        muted: "bg-[var(--control-surface)] text-[var(--control-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
