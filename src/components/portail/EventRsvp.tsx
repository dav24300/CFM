"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function EventRsvp({
  eventId,
  initialGoing,
  full,
}: {
  eventId: number;
  initialGoing: boolean;
  full?: boolean;
}) {
  const router = useRouter();
  const [going, setGoing] = useState(initialGoing);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const busy = loading || isPending;
  const disabled = busy || (full && !going);

  async function toggle() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/member/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = (await res.json()) as { going: boolean };
      setGoing(data.going);
      startTransition(() => router.refresh());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={going}
        className={cn(
          "whitespace-nowrap px-[18px] py-3 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          going
            ? "border border-site-hairline bg-white text-site-ink hover:bg-site-surface"
            : "bg-site-primary text-white hover:bg-site-deep"
        )}
      >
        {busy
          ? "…"
          : going
            ? "Je me désinscris"
            : full
              ? "Complet"
              : "Je participe"}
      </button>
      {error && (
        <span className="text-center text-[11px] text-site-danger">
          Une erreur est survenue. Réessayez.
        </span>
      )}
    </div>
  );
}
