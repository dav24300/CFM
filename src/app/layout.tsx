import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import { SITE } from "@/lib/constants";
import { PWARegister } from "@/components/PWARegister";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
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
};

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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
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
