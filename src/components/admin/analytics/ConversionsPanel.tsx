"use client";

import { useEffect, useState } from "react";
import { Heart, HandCoins, LifeBuoy, Radio, FileSignature, type LucideIcon } from "lucide-react";
import { Spinner } from "@/components/ui/primitives/spinner";
import { cn } from "@/lib/utils/cn";

type CtaKey = "cta_adhesion" | "cta_don" | "cta_aide" | "cta_petition" | "cta_live";

// Ordre d'affichage = priorité des conversions (adhésion/don en tête).
const CTA_META: { key: CtaKey; label: string; icon: LucideIcon }[] = [
  { key: "cta_adhesion", label: "Adhésions", icon: Heart },
  { key: "cta_don", label: "Dons", icon: HandCoins },
  { key: "cta_aide", label: "Demandes d'aide", icon: LifeBuoy },
  { key: "cta_petition", label: "Pétitions", icon: FileSignature },
  { key: "cta_live", label: "Live", icon: Radio },
];

const PERIODS = [7, 30, 90];

export function ConversionsPanel() {
  const [days, setDays] = useState(30);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d: { counts?: { event: string; count: number }[] }) => {
        if (cancelled) return;
        const map: Record<string, number> = {};
        for (const row of d.counts || []) map[row.event] = row.count;
        setCounts(map);
      })
      .catch(() => {
        if (!cancelled) setCounts({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const total = CTA_META.reduce((s, m) => s + (counts[m.key] || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-admin-ink">Conversions</h2>
          <p className="mt-1 text-[13px] text-admin-muted">
            Clics sur les appels à l&apos;action publics — {total.toLocaleString("fr-FR")} au total sur la période.
          </p>
        </div>
        <div
          className="flex gap-0.5 rounded-admin-ctrl border border-admin-border p-0.5"
          role="group"
          aria-label="Période"
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
              aria-pressed={days === p}
              className={cn(
                "rounded-admin-ctrl px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                days === p
                  ? "bg-admin-accent text-admin-accent-fg shadow-admin-rest"
                  : "text-admin-muted hover:text-admin-ink"
              )}
            >
              {p} j
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CTA_META.map(({ key, label, icon: Icon }) => {
              const value = counts[key] || 0;
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div
                  key={key}
                  className="rounded-admin-card border border-admin-border bg-admin-surface p-5 shadow-admin-rest"
                >
                  <div className="flex items-center gap-2 text-admin-muted-2">
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="text-[11.5px] font-semibold uppercase tracking-wide">{label}</span>
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold text-admin-ink">
                    {value.toLocaleString("fr-FR")}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-admin-bg">
                    <div className="h-full rounded-full bg-admin-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-admin-muted-2">{pct}% des clics</div>
                </div>
              );
            })}
          </div>

          {total === 0 && (
            <p className="rounded-admin-card border border-admin-border bg-admin-bg p-6 text-center text-[13px] leading-relaxed text-admin-muted">
              Aucun clic enregistré sur cette période. La collecte démarre dès que
              l&apos;endpoint <code className="text-admin-ink">/api/analytics</code> est
              actif en production (et que PostgreSQL est configuré).
            </p>
          )}
        </>
      )}
    </div>
  );
}
