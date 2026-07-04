import type { Metadata } from "next";

import { AnchorButton, ButtonLink } from "@/components/ui/patterns/button-link";
import { getPublishedStudies, getActiveCampaigns, getPublishedNews } from "@/lib/db";

import { FileText, Megaphone } from "lucide-react";

import { PageHero } from "@/components/ui/PageHero";

import { MediaCard } from "@/components/ui/MediaCard";

import { ScrollReveal } from "@/components/ui/ScrollReveal";

import { getResolvedGallery, getResolvedNewsCover } from "@/lib/media.server";

import { MEDIA } from "@/lib/media";

import { getTranslations } from "@/lib/i18n-server";



export async function generateMetadata(): Promise<Metadata> {

  const { t } = await getTranslations();

  return { title: t.pages.advocacy.title };

}



export default async function PlaidoyerPage() {

  const { t } = await getTranslations();

  const p = t.pages.advocacy;

  const studies = await getPublishedStudies();

  const campaigns = await getActiveCampaigns();

  const news = await getPublishedNews();

  const gallery = await getResolvedGallery();
  const newsCovers = await Promise.all(
    news.map((item) => getResolvedNewsCover(item.cover_image))
  );



  return (

    <>

      <PageHero

        title={p.title}

        subtitle={p.subtitle}

        image={gallery[2]?.src || gallery[0].src}

        imageAlt={p.heroAlt}

      />



      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">

        <ScrollReveal>

          <section>

            <div className="flex items-center gap-3">

              <FileText className="h-6 w-6 text-cfm-gold" aria-hidden />

              <h2 className="font-display text-2xl font-bold">{p.studiesTitle}</h2>

            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              {studies.map((study) => (

                <article key={study.slug} className="card">

                  <h3 className="font-display text-xl font-bold">{study.title}</h3>

                  <p className="mt-2 text-cfm-earth">{study.summary}</p>

                  <p className="mt-4 text-sm text-cfm-earth line-clamp-4">{study.content}</p>

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



        <ScrollReveal className="mt-16">

          <section>

            <div className="flex items-center gap-3">

              <Megaphone className="h-6 w-6 text-cfm-gold" aria-hidden />

              <h2 className="font-display text-2xl font-bold">{p.campaignsTitle}</h2>

            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              {campaigns.map((campaign) => (

                <div key={campaign.slug} id={campaign.slug} className="scroll-mt-24">

                  <MediaCard

                    image={campaign.image_url || MEDIA.news.default}

                    imageAlt={campaign.title}

                    title={campaign.title}

                    excerpt={campaign.description}

                    href={

                      campaign.petition_slug

                        ? `/petitions/${campaign.petition_slug}`

                        : "/petitions"

                    }

                    badge={t.common.campaign}

                    ctaLabel={t.common.discover}

                  />

                </div>

              ))}

            </div>

          </section>

        </ScrollReveal>



        <ScrollReveal className="mt-16">

          <section>

            <h2 className="font-display text-2xl font-bold">{p.newsTitle}</h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

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



        <ScrollReveal className="mt-12">

          <div className="rounded-xl bg-cfm-navy p-8 text-center text-white">

            <h2 className="font-display text-2xl font-bold text-cfm-gold">{p.ctaTitle}</h2>

            <p className="mt-2 text-gray-300">{p.ctaBody}</p>

            <ButtonLink href="/contact" className="mt-6">
              {p.contactBtn}
            </ButtonLink>

          </div>

        </ScrollReveal>

      </div>

    </>

  );

}

