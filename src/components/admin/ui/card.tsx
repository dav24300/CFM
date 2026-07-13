import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Carte admin — surface aérée, coin doux (14px), élévation token (clair/sombre).
 * Base de tout le dashboard : remplace le boilerplate `rounded-xl border … shadow-sm`.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-admin-card border border-admin-border bg-admin-surface shadow-admin-rest",
        interactive && "transition-shadow duration-200 hover:shadow-admin-raised",
        className
      )}
      {...props}
    />
  );
}

/** En-tête de carte : titre (Space Grotesk) + sous-titre + slot d'action. */
export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h3 className="font-display text-admin-h3 font-semibold text-admin-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12px] leading-snug text-admin-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
