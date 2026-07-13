import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** En-tête de page/panneau admin : titre (Space Grotesk) + sous-titre + actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-admin-h1 font-bold tracking-[-0.01em] text-admin-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-admin-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
