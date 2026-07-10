"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  ln: "LN",
  sw: "SW",
};

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  async function setLocale(locale: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-0.5 rounded-lg border border-site-primary/30 p-0.5 text-xs font-semibold">
      {(Object.keys(LABELS) as Locale[]).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          className={`rounded px-1.5 py-1 ${current === loc ? "bg-site-primary text-site-ink" : "text-site-ink"}`}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
