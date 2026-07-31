export const CTA_EVENTS = [
  "cta_live",
  "cta_aide",
  "cta_don",
  "cta_petition",
  "cta_adhesion",
] as const;

export type CtaEvent = (typeof CTA_EVENTS)[number];

export function trackCta(event: CtaEvent, detail?: Record<string, string>) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("cfm:cta", {
      detail: { event, ...detail },
    })
  );

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", event, detail);
  }

  // Sink interne best-effort → /api/analytics. sendBeacon survit à la navigation
  // déclenchée par le clic (un CTA quitte souvent la page immédiatement).
  try {
    const body = JSON.stringify({ event, href: detail?.href });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // télémétrie best-effort : jamais bloquant pour l'UX
  }
}
