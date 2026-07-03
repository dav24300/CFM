import { Radio } from "lucide-react";

type Props = {
  label?: string;
  className?: string;
};

export function LiveBadge({ label = "En direct", className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-red-600/15 px-3 py-1 text-sm font-semibold text-red-600 animate-live-pulse ${className}`}
    >
      <Radio className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}
