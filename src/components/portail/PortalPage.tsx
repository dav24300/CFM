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
  pending: "bg-[#fef3e2] text-[#b7791f]",
  in_progress: "bg-[#e7effa] text-[#2563aa]",
  treated: "bg-[#e3f3f0] text-site-success",
  completed: "bg-[#e3f3f0] text-site-success",
  approved: "bg-[#e3f3f0] text-site-success",
  failed: "bg-[#fbeae8] text-[#c0362c]",
  rejected: "bg-[#fbeae8] text-[#c0362c]",
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
