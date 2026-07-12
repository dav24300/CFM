import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import {
  Newsreader,
  Archivo,
  Space_Grotesk,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import {
  getOgImagePathCached as getOgImagePath,
  getFaviconPathCached as getFaviconPath,
} from "@/infrastructure/cache/media-cache";
import { getSiteConfig } from "@/lib/site-config.server";
import { getLocale, getTranslations } from "@/lib/i18n-server";
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
// Admin
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

const fontVars = `${newsreader.variable} ${archivo.variable} ${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const ogImage = await getOgImagePath();
  const favicon = await getFaviconPath();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`;
  const iconUrl = favicon.startsWith("http") ? favicon : `${baseUrl}${favicon}`;

  return {
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
  const locale = await getLocale();
  const { t } = await getTranslations();
  return (
    <html lang={locale} className={fontVars}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="theme-site font-sans bg-white text-site-ink antialiased">
        <I18nProvider locale={locale} messages={t}>
          <PWARegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
