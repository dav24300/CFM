import type { Metadata } from "next";
import { Download, Newspaper, Mail } from "lucide-react";
import { AnchorButton, ButtonLink } from "@/components/ui/patterns/button-link";
import { getPublishedPressReleasesCached as getPublishedPressReleases } from "@/infrastructure/cache/content-cache";
import { SITE } from "@/lib/constants";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { getTranslationsFor } from "@/lib/i18n-server";
import { dateLocale } from "@/lib/i18n";
import { getPressKitPathCached as getPressKitPath } from "@/infrastructure/cache/media-cache";
import { getPressKitAvailableCached } from "@/infrastructure/cache/public-page-cache";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsFor("fr");
  return { title: t.pages.press.title };
}

export default async function PressePage() {
  const { locale, t } = await getTranslationsFor("fr");
  const p = t.pages.press;
  const releases = await getPublishedPressReleases();
  const pressKitPath = await getPressKitPath();
  const hasPressKit = await getPressKitAvailableCached(pressKitPath);

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: "Accueil", href: "/" }, { label: p.title }]}
        kicker={locale === "en" ? "Press room" : "Espace presse"}
        title={p.title}
        subtitle={p.subtitle}
      />

      <div className="mx-auto max-w-site px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="border border-site-hairline bg-white p-7 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-site-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-lg font-medium text-site-ink">{p.pressKitTitle}</h3>
            <p className="mt-2 text-sm text-site-muted-2">{p.pressKitDesc}</p>
            {hasPressKit ? (
              <AnchorButton
                href={pressKitPath}
                download
                variant="secondary"
                size="sm"
                className="mt-4 inline-flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                {p.downloadPdf}
              </AnchorButton>
            ) : (
              <p className="mt-4 text-xs text-site-muted-2">
                <code>{p.pressKitHint}</code>
              </p>
            )}
          </div>

          <div className="border border-site-hairline bg-white p-7 text-center">
            <Mail className="mx-auto h-10 w-10 text-site-primary" aria-hidden />
            <h3 className="mt-4 font-serif text-lg font-medium text-site-ink">{p.contactPress}</h3>
            <p className="mt-2 text-sm text-site-muted-2">{SITE.email}</p>
            <ButtonLink href="/contact" size="sm" className="mt-4">
              {p.contactBtn}
            </ButtonLink>
          </div>

          <div className="border border-site-hairline bg-white p-7 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center bg-site-primary font-semibold text-white">
              CFM
            </div>
            <h3 className="mt-4 font-serif text-lg font-medium text-site-ink">{p.aboutCardTitle}</h3>
            <p className="mt-2 text-sm text-site-muted-2">
              {p.aboutCardDesc.replace("{year}", String(SITE.founded))}
            </p>
            <ButtonLink href="/a-propos" variant="secondary" size="sm" className="mt-4">
              {p.learnMore}
            </ButtonLink>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-serif text-2xl font-medium text-site-ink">{p.releasesTitle}</h2>
          <div className="mt-6 space-y-4">
            {releases.map((release) => (
              <article key={release.slug} className="border border-site-hairline bg-white p-6">
                <time className="text-xs text-site-muted-2">
                  {new Date(release.created_at).toLocaleDateString(dateLocale(locale), {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h3 className="mt-1 font-serif text-xl font-medium text-site-ink">{release.title}</h3>
                <p className="mt-2 text-site-muted">{release.content}</p>
                {release.file_url && (
                  <AnchorButton
                    href={release.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                  >
                    {p.downloadRelease}
                  </AnchorButton>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
