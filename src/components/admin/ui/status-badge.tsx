import { cn } from "@/lib/utils/cn";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  new: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-red-100 text-red-800",
  treated: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  live: "bg-red-100 text-red-800",
  scheduled: "bg-purple-100 text-purple-800",
  ended: "bg-gray-100 text-gray-800",
  replay: "bg-cfm-navy/10 text-cfm-navy",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        STATUS_COLORS[key] || "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}
