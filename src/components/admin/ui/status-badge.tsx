import { cn } from "@/lib/utils/cn";

// Statut → classe helper (globals.css : badge-warn/ok/info/danger).
const STATUS_COLORS: Record<string, string> = {
  pending: "badge-warn",
  new: "badge-warn",
  approved: "badge-ok",
  active: "badge-ok",
  completed: "badge-ok",
  rejected: "badge-danger",
  suspended: "badge-danger",
  live: "badge-danger",
  treated: "badge-info",
  in_progress: "badge-info",
  read: "badge-info",
  scheduled: "badge-info",
  ended: "bg-admin-bg text-admin-muted",
  replay: "bg-admin-bg text-admin-muted",
  archived: "bg-admin-bg text-admin-muted",
  inactive: "bg-admin-bg text-admin-muted",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        STATUS_COLORS[key] || "bg-admin-bg text-admin-muted"
      )}
    >
      {status}
    </span>
  );
}
