import "server-only";
import fs from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";
import { getAllDonations } from "@/infrastructure/repositories/donations.repository";
import { getPollsForEvent } from "@/infrastructure/repositories/live.repository";

/**
 * Dernières lectures publiques qui frappaient encore la base (ou le disque) à
 * chaque rendu. Elles empêchaient la mise en cache des pages qui les
 * contiennent — et, une fois ces pages prérendues, elles auraient figé des
 * données sans voie de rafraîchissement.
 */
const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

/**
 * Totaux de la transparence financière.
 *
 * `getAllDonations()` chargeait la table ENTIÈRE à chaque affichage de
 * /s-engager pour n'en tirer que trois nombres et cinq lignes. L'agrégation
 * reste en mémoire (le volume de dons est modeste) mais n'est plus refaite à
 * chaque visite. Pas de tag : ces chiffres tolèrent quelques minutes de
 * décalage, et cela évite d'ajouter une invalidation sur le chemin de paiement.
 */
export const getDonationTotalsCached = unstable_cache(
  async () => {
    const completees = (await getAllDonations()).filter((d) => d.status === "completed");
    return {
      count: completees.length,
      totalUsd: completees
        .filter((d) => d.currency === "USD")
        .reduce((somme, d) => somme + d.amount, 0),
      totalCdf: completees
        .filter((d) => d.currency === "CDF")
        .reduce((somme, d) => somme + d.amount, 0),
      // Cinq dons les plus récents, sans email ni téléphone.
      recents: completees
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5)
        .map((d) => ({
          id: d.id,
          donor_name: d.donor_name,
          amount: d.amount,
          currency: d.currency,
          created_at: d.created_at,
        })),
    };
  },
  ["cfm-donation-totals"],
  { revalidate: REVALIDATE_SECONDS }
);

/**
 * Présence du dossier de presse sur le disque.
 *
 * `fs.existsSync` était appelé à chaque rendu de /presse. Rattaché au tag des
 * médias : un dépôt depuis l'admin invalide le résultat.
 */
export function getPressKitAvailableCached(kitPath: string) {
  return unstable_cache(
    async () => fs.existsSync(path.join(process.cwd(), "public", kitPath.replace(/^\//, ""))),
    [`cfm-press-kit-${kitPath}`],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}

/** Sondages d'un live — rattachés au tag `live`, invalidé par l'admin. */
export function getPollsForEventCached(eventId: number) {
  return unstable_cache(
    () => getPollsForEvent(eventId),
    [`cfm-live-polls-${eventId}`],
    { tags: [CACHE_TAGS.live], revalidate: REVALIDATE_SECONDS }
  )();
}
