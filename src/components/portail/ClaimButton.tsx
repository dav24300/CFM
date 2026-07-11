"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function ClaimButton({ missionId }: { missionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/member/entraide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: missionId }),
      });
      if (!res.ok) {
        throw new Error("claim_failed");
      }
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-2 bg-site-primary px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-site-deep",
          loading && "cursor-not-allowed opacity-70"
        )}
        data-cta="cta_entraide_claim"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        {loading ? "Envoi…" : "Je participe"}
      </button>
      {error && <p className="text-xs text-site-danger">{error}</p>}
    </div>
  );
}
