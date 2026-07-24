import type { Metadata } from "next";

/**
 * Tunnel d'authentification (connexion, inscription, mot de passe).
 *
 * Ces pages restent volontairement CRAWLABLES — le `robots.txt` ne les bloque
 * pas — pour qu'un moteur puisse lire ce `noindex`. Les bloquer au crawl les
 * laisserait indexées « à l'aveugle » à cause des liens entrants depuis le
 * site public (en-tête, pied de page, /s-engager, /contact, /petitions).
 *
 * Ce layout ne rend aucune enveloppe : il ne sert qu'à porter la directive
 * pour les 4 pages du tunnel, sans toucher au rendu ni à leur statification.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function MembreAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
