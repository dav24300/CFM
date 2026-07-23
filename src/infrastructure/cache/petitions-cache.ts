import "server-only";
import { unstable_cache } from "next/cache";
import {
  getActivePetitions,
  getPetitionBySlug,
} from "@/infrastructure/repositories/petitions.repository";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

export const getActivePetitionsCached = unstable_cache(
  getActivePetitions,
  ["cfm-petitions-active"],
  { tags: [CACHE_TAGS.petitions], revalidate: REVALIDATE_SECONDS }
);

/**
 * Pétition par slug, RATTACHÉE au tag `petitions`.
 *
 * La page de détail lisait le dépôt en direct, sans tag. Tant que rien n'est
 * prérendu cela ne se voit pas, mais dès que la page sera statique son cache
 * de route ne serait rattaché à aucun tag : le compteur de signatures y
 * resterait figé pour toujours, sans aucune voie d'invalidation. Chaque
 * signature appelle déjà `invalidatePetitionsCache()`.
 */
export function getPetitionBySlugCached(slug: string) {
  return unstable_cache(
    () => getPetitionBySlug(slug),
    [`cfm-petition-${slug}`],
    { tags: [CACHE_TAGS.petitions], revalidate: REVALIDATE_SECONDS }
  )();
}
