import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/base-url";

/**
 * Seule la vitrine est indexée.
 *
 * Point important : on N'INTERDIT PAS le crawl de /membre. Ces pages portent
 * une balise `noindex`, et un moteur doit pouvoir les charger pour la lire —
 * un `Disallow` l'en empêcherait, et les pages resteraient indexées « à
 * l'aveugle » à cause des liens entrants depuis le site public (en-tête, pied
 * de page, /s-engager, /contact, /petitions).
 *
 * /admin et /api sont en revanche bloqués : aucune raison de les explorer, et
 * ils ne sont liés depuis nulle part.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
