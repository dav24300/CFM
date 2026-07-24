import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/base-url";
import { AXES } from "@/lib/constants";
import {
  getPublishedNewsCached,
  getActionsCached,
} from "@/infrastructure/cache/content-cache";
import { getActivePetitionsCached } from "@/infrastructure/cache/petitions-cache";
import { getLiveEventsCached } from "@/infrastructure/cache/live-cache";

/**
 * Sitemap — VITRINE UNIQUEMENT.
 *
 * Sont volontairement absents : l'espace membre (/membre/*), l'administration
 * (/admin/*), les routes d'API, et le tunnel d'authentification. Ces surfaces
 * portent par ailleurs un `noindex` — ne pas les lister ici évite simplement
 * de les proposer au crawl.
 *
 * Aligné sur le TTL des caches de contenu (300 s par défaut,
 * CFM_CONTENT_CACHE_TTL) : inutile de régénérer le sitemap plus souvent que
 * les données qu'il décrit.
 */
export const revalidate = 300;

/** Une date invalide ferait échouer la sérialisation XML (RangeError → 500). */
function safeDate(value: unknown): Date {
  const d = new Date(String(value ?? ""));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();

  // Pas de try/catch : en cas d'indisponibilité, mieux vaut laisser Next servir
  // la version précédente que de publier — et de mettre en cache pendant tout
  // l'intervalle de revalidation — un sitemap tronqué.
  const [news, petitions, lives, actions] = await Promise.all([
    getPublishedNewsCached(),
    getActivePetitionsCached(),
    getLiveEventsCached(),
    getActionsCached(),
  ]);

  const staticPaths = [
    "",
    "/a-propos",
    "/axes",
    "/actions",
    "/plaidoyer",
    "/petitions",
    "/live",
    "/presse",
    "/s-engager",
    "/contact",
    "/mentions-legales",
    "/confidentialite",
  ];

  const derniereAction = actions.length ? safeDate(actions[0]?.date) : new Date();

  return [
    ...staticPaths.map((p) => ({
      url: `${base}${p}`,
      lastModified: p === "/actions" ? derniereAction : new Date(),
    })),
    ...AXES.map((axe) => ({ url: `${base}/axes/${axe.slug}`, lastModified: new Date() })),
    ...news.map((n) => ({
      url: `${base}/actualites/${n.slug}`,
      lastModified: safeDate(n.created_at),
    })),
    ...petitions.map((p) => ({
      url: `${base}/petitions/${p.slug}`,
      lastModified: safeDate(p.created_at),
    })),
    // Seuls les directs déjà annoncés : un événement encore « programmé » n'a
    // pas à être découvert par un moteur avant sa publication.
    // getLiveEventsCached ne filtre AUCUN statut, contrairement aux actualités
    // (published = 1) et aux pétitions (active = 1).
    ...lives
      .filter((l) => l.status !== "scheduled")
      .map((l) => ({
        url: `${base}/live/${l.slug}`,
        lastModified: safeDate(l.created_at),
      })),
  ];
}
