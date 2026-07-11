export type CtaEvent =
  | "cta_live"
  | "cta_aide"
  | "cta_don"
  | "cta_petition"
  | "cta_adhesion";

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
}
