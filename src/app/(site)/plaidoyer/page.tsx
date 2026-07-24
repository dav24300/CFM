import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { FileText, Megaphone } from "lucide-react";
import { AnchorButton } from "@/components/ui/patterns/button-link";
import {
  getPublishedStudiesCached as getPublishedStudies,
  getActiveCampaignsCached as getActiveCampaigns,
  getPublishedNewsCached as getPublishedNews,
} from "@/infrastructure/cache/content-cache";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { MediaCard } from "@/components/ui/MediaCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  getResolvedGalleryCached as getResolvedGallery,
  getResolvedNewsCoverCached as getResolvedNewsCover,
} from "@/infrastructure/cache/media-cache";
import { getTranslationsFor } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsFor("fr");
  return { title: t.pages.advocacy.title };
}

export default async function PlaidoyerPage() {
  const { t } = await getTranslationsFor("fr");
  const p = t.pages.advocacy;
  const studies = await getPublishedStudies();
  const campaigns = await getActiveCampaigns();
  const news = await getPublishedNews();

  const gallery = await getResolvedGallery();
  const defaultHero = await getResolvedNewsCover(null);
  const heroImage = gallery[2]?.src || gallery[0]?.src || defaultHero;
  const campaignCovers = await Promise.all(campaigns.map((c) => getResolvedNewsCover(c.image_url)));
  const newsCovers = await Promise.all(news.map((item) => getResolvedNewsCover(item.cover_image)));

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: "Accueil", href: "/" }, { label: p.title }]}
        kicker="Notre plaidoyer"
        title={p.title}
        subtitle={p.subtitle}
        image={heroImage}
        imageAlt={p.heroAlt}
      />

      <div className="mx-auto max-w-site px-6 py-20">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border border-site-hairline bg-site-surface px-6 py-4">
          <p className="font-medium text-site-ink">{p.campaignsTitle}</p>
          <Link
            href="/petitions"
            className="text-sm font-semibold text-site-primary hover:underline"
            data-cta="cta_petition"
          >
            {t.ux.plaidoyer.viewPetitions}
          </Link>
        </div>

        {/* Études */}
        <ScrollReveal>
          <section>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-site-primary" aria-hidden />
              <h2 className="font-serif text-2xl font-medium text-site-ink">{p.studiesTitle}</h2>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {studies.map((study) => (
                <article key={study.slug} className="border border-site-hairline bg-white p-6">
                  <h3 className="font-serif text-xl font-medium text-site-ink">{study.title}</h3>
                  <p className="mt-2 text-site-muted">{study.summary}</p>
                  <p className="mt-4 text-sm text-site-muted-2 line-clamp-4">{study.content}</p>
                  {study.file_url && (
                    <AnchorButton
                      href={study.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                    >
                      {p.downloadPdf}
                    </AnchorButton>
                  )}
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Campagnes */}
        <ScrollReveal className="mt-16">
          <section>
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-site-primary" aria-hidden />
              <h2 className="font-serif text-2xl font-medium text-site-ink">{p.campaignsTitle}</h2>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {campaigns.map((campaign, idx) => (
                <div key={campaign.slug} id={campaign.slug} className="scroll-mt-24">
                  <MediaCard
                    image={campaignCovers[idx]}
                    imageAlt={campaign.title}
                    title={campaign.title}
                    excerpt={campaign.description}
                    href={campaign.petition_slug ? `/petitions/${campaign.petition_slug}` : "/petitions"}
                    badge={t.common.campaign}
                    ctaLabel={t.common.discover}
                  />
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Actualités */}
        <ScrollReveal className="mt-16">
          <section>
            <h2 className="font-serif text-2xl font-medium text-site-ink">{p.newsTitle}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {news.map((item, idx) => (
                <MediaCard
                  key={item.slug}
                  image={newsCovers[idx]}
                  imageAlt={item.cover_image_alt || item.title}
                  title={item.title}
                  excerpt={item.excerpt}
                  href={`/actualites/${item.slug}`}
                  badge={item.category}
                  ctaLabel={t.common.discover}
                />
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal className="mt-16">
          <div className="bg-site-deep px-10 py-12 text-center text-white">
            <h2 className="font-serif text-2xl font-medium text-site-light">{p.ctaTitle}</h2>
            <p className="mt-2 text-white/70">{p.ctaBody}</p>
            <ButtonLink
              href="/contact"
              className="mt-6 px-7 py-3.5 text-sm"
              data-cta="cta_aide"
            >
              {p.contactBtn}
            </ButtonLink>
          </div>
        </ScrollReveal>
      </div>
    </>
  );
}
