import { getActivePetitionsCached } from "@/infrastructure/cache/petitions-cache";
import { jsonPublicCached } from "@/infrastructure/http/api-response";

export async function GET() {
  // Passe désormais par le cache applicatif (le wrapper existait mais n'était
  // pas utilisé ici) puis par le CDN : liste identique pour tous les visiteurs.
  return jsonPublicCached(await getActivePetitionsCached());
}
