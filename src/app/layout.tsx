import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import {
  Newsreader,
  Archivo,
  Space_Grotesk,
  IBM_Plex_Mono,
} from "next/font/google";
import {
  getOgImagePathCached as getOgImagePath,
  getFaviconPathCached as getFaviconPath,
} from "@/infrastructure/cache/media-cache";
import { getSiteConfig } from "@/lib/site-config.server";
import { getBaseUrl } from "@/lib/base-url";
import { getTranslationsFor } from "@/lib/i18n-server";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { PWARegister } from "@/components/PWARegister";

// Public / Portail
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700"],
});
// Essentiellement admin (`font-display`), mais aussi un titre public
// (PetitionSignForm) : la famille reste globale, sans préchargement — elle
// n'est jamais l'élément de plus grand rendu d'une page publique.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
  preload: false,
});
// `font-mono` : usage ponctuel (pages d'erreur, /axes, quelques vues admin).
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  preload: false,
});

// IBM Plex Sans a été retirée : la classe `font-ui` qui la portait n'était
// utilisée nulle part, mais ses 4 graisses (24 @font-face) étaient servies
// sur toutes les routes, y compris publiques.
const fontVars = `${newsreader.variable} ${archivo.variable} ${spaceGrotesk.variable} ${plexMono.variable}`;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const ogImage = await getOgImagePath();
  const favicon = await getFaviconPath();
  // getBaseUrl ne lit que des variables d'environnement — surtout AUCUNE API
  // dynamique ici (cookies/headers/searchParams) : ce layout est le seul
  // ancêtre commun des pages prérendues, une telle lecture dé-statifierait
  // tout le site.
  const baseUrl = getBaseUrl();
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`;
  const iconUrl = favicon.startsWith("http") ? favicon : `${baseUrl}${favicon}`;

  return {
    // Rend absolues les URLs des métadonnées (openGraph, alternates).
    // N'agit PAS sur `icons` — d'où l'URL déjà absolue construite ci-dessus.
    metadataBase: new URL(baseUrl),
    title: {
      default: `${site.sigle} — ${site.name}`,
      template: `%s | ${site.sigle}`,
    },
    description: site.tagline,
    keywords: [
      "familles militaires",
      "RDC",
      "ASBL",
      "droits",
      "veuves militaires",
      "orphelins",
      "plaidoyer",
    ],
    openGraph: {
      images: [{ url: imageUrl }],
    },
    icons: {
      icon: iconUrl,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#14418a",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Base FRANÇAISE, sans lecture de cookie : c'est cet appel qui rendait toute
  // l'application dynamique. Le portail (dynamique par nature — il exige une
  // session) réinjecte la locale du membre via un I18nProvider imbriqué.
  const locale = "fr" as const;
  const { t } = await getTranslationsFor(locale);
  return (
    <html lang={locale} className={fontVars}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="theme-site font-sans bg-white text-site-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-[var(--control-accent)] focus:px-4 focus:py-2 focus:font-semibold focus:text-[var(--control-accent-fg)] focus:outline-none focus:ring-2 focus:ring-white"
        >
          Aller au contenu principal
        </a>
        <I18nProvider locale={locale} messages={t}>
          <PWARegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
