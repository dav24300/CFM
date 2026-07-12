import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Conteneur commun des écrans intérieurs du portail. */
export function PortalPage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-6 py-7">
      <div className="mx-auto max-w-portal">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[clamp(22px,2.6vw,30px)] font-medium leading-[1.1] text-site-ink">
              {title}
            </h1>
            {subtitle && <p className="mt-1.5 text-sm text-site-muted-2">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

const PILL: Record<string, string> = {
  new: "bg-site-pale text-site-primary",
  pending: "bg-site-warn-bg text-site-warn-fg",
  in_progress: "bg-site-info-bg text-site-info-fg",
  treated: "bg-site-ok-bg text-[var(--control-success-fg)]",
  completed: "bg-site-ok-bg text-[var(--control-success-fg)]",
  approved: "bg-site-ok-bg text-[var(--control-success-fg)]",
  failed: "bg-site-danger-bg text-site-danger",
  rejected: "bg-site-danger-bg text-site-danger",
};

const STATUS_LABEL: Record<string, string> = {
  new: "Nouveau",
  pending: "En attente",
  in_progress: "En cours",
  treated: "Traité",
  completed: "Complété",
  approved: "Approuvé",
  failed: "Échoué",
  rejected: "Refusé",
};

export function PortalStatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 text-xs font-semibold capitalize",
        PILL[key] ?? "bg-site-surface text-site-muted-2"
      )}
    >
      {STATUS_LABEL[key] ?? status}
    </span>
  );
}

export function PortalEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-site-hairline bg-white px-6 py-12 text-center text-sm text-site-muted-2">
      {children}
    </div>
  );
}
