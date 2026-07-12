import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CtaTracker } from "@/components/ux/CtaTracker";
import { getLocale, getTranslations } from "@/lib/i18n-server";
import { getSiteConfig } from "@/lib/site-config.server";
import { getMemberSessionUserId } from "@/infrastructure/auth/member-auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const { t } = await getTranslations();
  const site = await getSiteConfig();
  const userId = await getMemberSessionUserId();

  return (
    <>
      <CtaTracker />
      <Header
        locale={locale}
        site={site}
        nav={t.nav}
        memberLogin={t.member.login}
        isAuthenticated={Boolean(userId)}
        memberArea={t.member.dashboard}
      />
      <main id="main-content" className="min-h-screen bg-site-surface page-enter">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
