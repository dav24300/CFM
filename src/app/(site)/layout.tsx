import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getLocale } from "@/lib/i18n-server";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <>
      <Header locale={locale} />
      <main className="min-h-screen bg-cfm-cream page-enter">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
