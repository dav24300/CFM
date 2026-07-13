import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** État vide brandé : icône cerclée d'accent + titre + copy + CTA optionnel. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-admin-card border border-dashed border-admin-border bg-admin-surface px-6 py-14 text-center",
        className
      )}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-admin-accent/10 text-admin-accent">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <h3 className="font-display text-admin-h2 font-semibold text-admin-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-admin-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
