import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import { SITE } from "@/lib/constants";
import { getOgImagePath, getFaviconPath } from "@/lib/media.server";
import { PWARegister } from "@/components/PWARegister";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = await getOgImagePath();
  const favicon = await getFaviconPath();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`;
  const iconUrl = favicon.startsWith("http") ? favicon : `${baseUrl}${favicon}`;

  return {
    title: {
      default: `${SITE.sigle} — ${SITE.name}`,
      template: `%s | ${SITE.sigle}`,
    },
    description: SITE.tagline,
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
  themeColor: "#1a2f4a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${nunito.variable} ${playfair.variable} font-sans bg-cfm-cream text-cfm-navy antialiased`}
      >
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
