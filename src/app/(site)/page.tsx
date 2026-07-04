import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { SITE, AXES } from "@/lib/constants";
import {
  getPublishedTestimonials,
  getPublishedNews,
} from "@/lib/db";
import { getActiveLiveEvent } from "@/lib/live";
import { getSiteMedia, getResolvedLiveThumb, getResolvedNewsCover, getResolvedAxisImage, getResolvedTestimonialPhoto } from "@/lib/media.server";
import { MEDIA } from "@/lib/media";
import { getTranslations } from "@/lib/i18n-server";
import { NewsletterForm } from "@/components/NewsletterForm";
import { HeroMedia, HeroItem } from "@/components/ui/HeroMedia";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MediaCard } from "@/components/ui/MediaCard";
import { StatCounter } from "@/components/ui/StatCounter";
import { TestimonialCarousel } from "@/components/ui/TestimonialCarousel";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { HomeAxesStrip } from "@/components/home/HomeAxesStrip";

export default async function HomePage() {
  const { locale, t } = await getTranslations();
  const p = t.pages.home;
  const media = await getSiteMedia();
  const testimonials = await getPublishedTestimonials();
  const latestNews = (await getPublishedNews()).slice(0, 3);
  const activeLive = await getActiveLiveEvent();
  const countryLabel = locale === "en" ? "DRC" : SITE.country;

  const newsCovers = await Promise.all(
    latestNews.map((n) => getResolvedNewsCover(n.cover_image))
  );
  const axisItems = await Promise.all(
    AXES.map(async (axe) => ({
      slug: axe.slug,
      title: axe.title,
      description: axe.description,
      image: await getResolvedAxisImage(axe.slug),
    }))
  );
  const liveThumb = await getResolvedLiveThumb(activeLive?.thumbnail);
  const testimonialPhotos = await Promise.all(
    testimonials.map((item, i) =>
      getResolvedTestimonialPhoto(Boolean(item.anonymous), i, item.photo)
    )
  );

  return (
    <>
      {/* Section 1 — Hero */}
      <HeroMedia
        image={media.heroImage}
        imageAlt="Familles militaires — CFM ASBL"
        video={media.heroVideo || undefined}
        poster={media.heroPoster}
      >
        <HeroItem>
          <p className="text-sm font-semibold uppercase tracking-widest text-cfm-gold">
            ASBL — {countryLabel}
          </p>
        </HeroItem>
        <HeroItem>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight text-balance md:text-5xl lg:text-6xl">
            {SITE.name}
          </h1>
        </HeroItem>
        <HeroItem>
          <p className="mt-4 max-w-2xl text-xl text-gray-200">{SITE.tagline}</p>
        </HeroItem>
        <HeroItem>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/contact#aide">{p.heroCtaHelp}</ButtonLink>
            <ButtonLink href="/s-engager" variant="outlineLight">
              {p.heroCtaEngage}
            </ButtonLink>
          </div>
        </HeroItem>
      </HeroMedia>

      {/* Section 2 — Mission + chiffres */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal direction="left">
              <div className="media-frame relative aspect-[4/3]">
                <Image
                  src={media.missionImage}
                  alt="Mission CFM — familles militaires"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.1}>
              <div>
                <h2 className="section-title">{p.missionTitle}</h2>
                <p className="section-subtitle">{p.missionSubtitle}</p>
                <p className="mt-4 text-cfm-earth leading-relaxed">
                  {locale === "en"
                    ? p.missionBody
                    : `Fondée en ${SITE.founded} par ${SITE.founder}, CFM analyse les faiblesses liées au social et aux secteurs de la vie courante des dépendants des militaires.`}
                </p>
                <Link
                  href="/a-propos"
                  className="mt-6 inline-flex items-center gap-2 font-semibold text-cfm-gold hover:underline"
                >
                  En savoir plus <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <StatCounter value={SITE.founded} label="Fondation" />
                  <StatCounter value={26} label="Provinces" />
                  <StatCounter value={2025} label="FIKIN — rassemblement" />
                </div>
              </div>
            </ScrollReveal>
          </div>

          {latestNews.length > 0 && (
            <ScrollReveal className="mt-16">
              <div className="flex items-end justify-between">
                <h3 className="font-display text-2xl font-bold text-cfm-navy">{p.newsTitle}</h3>
                <Link href="/plaidoyer" className="text-sm font-semibold text-cfm-gold hover:underline">
                  Tout voir →
                </Link>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {latestNews.map((n, idx) => (
                  <MediaCard
                    key={n.slug}
                    image={newsCovers[idx]}
                    imageAlt={n.cover_image_alt || n.title}
                    title={n.title}
                    excerpt={n.excerpt}
                    href={`/actualites/${n.slug}`}
                    badge={n.category}
                    ctaLabel={t.common.discover}
                  />
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Section 3 — Axes */}
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <h2 className="section-title text-center">{p.axesTitle}</h2>
            <p className="section-subtitle mx-auto max-w-2xl text-center">
              Des solutions pragmatiques pour améliorer durablement le quotidien des dépendants.
            </p>
          </ScrollReveal>
          <HomeAxesStrip axes={axisItems} />
        </div>
      </section>

      {/* Section 4 — Live */}
      <section className="border-y border-cfm-gold/10 bg-cfm-cream py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="media-frame relative aspect-video bg-cfm-navy">
                <Image
                  src={liveThumb}
                  alt={activeLive?.title || "Événements live CFM"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {activeLive && (
                  <div className="absolute left-4 top-4">
                    <LiveBadge label={p.liveSectionTitle ?? "En direct"} />
                  </div>
                )}
              </div>
              <div>
                <h2 className="section-title">{p.liveSectionTitle ?? "Live & événements"}</h2>
                <p className="section-subtitle">
                  {activeLive
                    ? activeLive.description
                    : (p.liveSectionSubtitle ?? "Suivez nos diffusions en direct.")}
                </p>
                <ButtonLink
                  href={activeLive ? `/live/${activeLive.slug}` : "/live"}
                  className="mt-6"
                >
                  {activeLive
                    ? (p.liveSectionCta ?? "Rejoindre le live")
                    : (p.liveSectionCta ?? "Voir les lives")}
                </ButtonLink>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 5 — Témoignages */}
      <section className="bg-cfm-navy py-24 md:py-32 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-cfm-gold md:text-4xl">
              {p.testimonialsTitle}
            </h2>
          </ScrollReveal>
          <div className="mt-10">
            <TestimonialCarousel
              items={testimonials.map((item, i) => ({
                content: item.content,
                author: item.anonymous ? "Anonyme" : item.author || "Membre CFM",
                role: item.role,
                photo: testimonialPhotos[i],
                photoAlt: item.photo_alt || undefined,
              }))}
            />
          </div>
        </div>
      </section>

      {/* Section 6 — CTA */}
      <section className="bg-cfm-warm/10 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <ScrollReveal>
            <h2 className="section-title">Rejoignez le mouvement</h2>
            <p className="section-subtitle mx-auto max-w-2xl">
              Adhérez, soutenez ou devenez bénévole pour défendre les droits des familles militaires.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/s-engager">S&apos;engager</ButtonLink>
              <ButtonLink href="/s-engager#don" variant="secondary">
                Faire un don
              </ButtonLink>
            </div>
            <div className="mx-auto mt-10 max-w-md">
              <NewsletterForm />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
