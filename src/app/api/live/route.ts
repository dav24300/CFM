import { getLiveEventsCached } from "@/infrastructure/cache/live-cache";
import { jsonPublicCached } from "@/infrastructure/http/api-response";

export async function GET() {
  // `getActiveLiveEvent()` relançait en interne un second `getLiveEvents()` :
  // deux lectures complètes de la table pour une seule requête HTTP. L'événement
  // actif se déduit de la liste déjà chargée.
  const events = await getLiveEventsCached();
  const active = events.find((e) => e.status === "live");
  return jsonPublicCached({ events, active }, { sMaxAge: 30, staleWhileRevalidate: 120 });
}
