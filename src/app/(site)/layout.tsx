import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CtaTracker } from "@/components/ux/CtaTracker";
import { getTranslationsFor } from "@/lib/i18n-server";
import { getSiteConfig } from "@/lib/site-config.server";

// Site public : rendu FRANÇAIS statique. Aucune lecture de cookie (ni langue,
// ni session) — les deux rendaient les pages dynamiques. L'état de connexion
// est résolu côté client par le Header (cookie-indice non sensible + repli sur
// /api/member/me).
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getTranslationsFor("fr");
  const site = await getSiteConfig();

  return (
    <>
      <CtaTracker />
      <Header
        site={site}
        nav={t.nav}
        memberLogin={t.member.login}
        memberArea={t.member.dashboard}
      />
      <main id="main-content" className="min-h-screen bg-site-surface page-enter">{children}</main>
      <Footer locale="fr" />
    </>
  );
}
