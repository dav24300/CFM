import { cn } from "@/lib/utils/cn";

export type PublishState = "draft" | "assigned" | "online" | "fallback";

const CONFIG: Record<PublishState, { label: string; cls: string; dot: string }> = {
  draft: { label: "Brouillon", cls: "border border-admin-border bg-admin-bg text-admin-muted", dot: "bg-admin-muted-2" },
  assigned: { label: "Assigné", cls: "bg-admin-accent/10 text-admin-accent", dot: "bg-admin-accent" },
  online: { label: "En ligne", cls: "bg-admin-ok-bg text-admin-ok-fg", dot: "bg-admin-ok-fg" },
  fallback: { label: "Défaut", cls: "bg-admin-warn-bg text-admin-warn-fg", dot: "bg-admin-warn-fg" },
};

/** État de publication d'un média, vocabulaire unifié et tokenisé (clair/sombre). */
export function PublishBadge({ state, className }: { state: PublishState; className?: string }) {
  const c = CONFIG[state];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        c.cls,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
