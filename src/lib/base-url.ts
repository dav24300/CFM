import "server-only";

/**
 * URL absolue du site, pour les métadonnées canoniques, le sitemap et les liens
 * sortants (emails, notifications push).
 *
 * Pilotée par `NEXT_PUBLIC_SITE_URL` : la bascule vers le domaine définitif ne
 * demande donc AUCUNE modification de code.
 *
 * Volontairement SANS repli sur `VERCEL_URL` : cette variable contient l'URL
 * ÉPHÉMÈRE du déploiement (`cfm-git-abc123-….vercel.app`) et elle est toujours
 * définie pendant un build Vercel. S'en servir de repli graverait cette adresse
 * jetable dans les pages prérendues, les canoniques et le sitemap — plus
 * dangereux qu'un localhost, parce que plausible et indexable.
 * `VERCEL_PROJECT_PRODUCTION_URL`, lui, est l'alias stable du projet.
 */
export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const productionAlias = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionAlias) return `https://${productionAlias.replace(/\/+$/, "")}`;

  if (process.env.NODE_ENV === "production") {
    // Ne pas interrompre le build (le dépôt valide déjà sa configuration dans
    // src/lib/config.ts) — mais rendre l'oubli impossible à manquer.
    console.warn(
      "[CFM] NEXT_PUBLIC_SITE_URL absente : les URLs canoniques et le sitemap retombent sur localhost."
    );
  }
  return "http://localhost:3000";
}
