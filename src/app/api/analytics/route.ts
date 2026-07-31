import { NextRequest } from "next/server";
import { recordCtaEvent } from "@/infrastructure/repositories/analytics.repository";
import { CTA_EVENTS } from "@/lib/analytics";

const EVENTS = new Set<string>(CTA_EVENTS);

/**
 * Sink de télémétrie CTA. Public, best-effort, non nominatif.
 *
 * Répond TOUJOURS 204 — même sur entrée invalide : jamais d'erreur remontée au
 * visiteur (le client envoie via sendBeacon, il ignore la réponse), et aucune
 * fuite de validation. Un événement inconnu est simplement ignoré. Rate-limité
 * par le middleware (préfixe /api/analytics).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const event = body?.event;
    if (typeof event === "string" && EVENTS.has(event)) {
      const href = typeof body?.href === "string" ? body.href.slice(0, 300) : null;
      await recordCtaEvent({ event, href });
    }
  } catch {
    // best-effort : ne jamais faire échouer le client
  }
  return new Response(null, { status: 204 });
}
