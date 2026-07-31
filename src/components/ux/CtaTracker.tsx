"use client";

import { useEffect } from "react";
import { CTA_EVENTS, trackCta, type CtaEvent } from "@/lib/analytics";

const VALID_EVENTS = new Set<CtaEvent>(CTA_EVENTS);

export function CtaTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cta]");
      if (!target) return;
      const name = target.getAttribute("data-cta");
      if (name && VALID_EVENTS.has(name as CtaEvent)) {
        const href = target.getAttribute("href");
        trackCta(name as CtaEvent, href ? { href } : undefined);
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
