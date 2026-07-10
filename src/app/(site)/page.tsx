import Link from "next/link";
import Image from "next/image";
import { Heart, Briefcase, BookOpen, Leaf, Activity, Play, Quote } from "lucide-react";
import { AXES } from "@/lib/constants";
import { getSiteConfig } from "@/lib/site-config.server";
import { getPublishedTestimonials } from "@/lib/db";
import { getActiveLiveEventCached } from "@/infrastructure/cache/live-cache";
import {
  getSiteMedia,
  getResolvedLiveThumb,
  getResolvedTestimonialPhoto,
} from "@/lib/media.server";
import { getTranslations } from "@/lib/i18n-server";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeStats } from "@/components/home/HomeStats";
import { MagneticLink } from "@/components/home/MagneticLink";

const AXIS_ICONS: Record<string, typeof Heart> = {
  heart: Heart,
  briefcase: Briefcase,
  book: BookOpen,
  leaf: Leaf,
  activity: Activity,
};

// Résumés courts par axe (cf. Accueil.dc.html).
const AXIS_TEASERS: Record<string, string> = {
  social: "Améliorer les conditions de vie des veuves, orphelins et enfants de militaires.",
  economique: "Autonomisation des femmes et veuves par l'entrepreneuriat.",
  education: "Garantir l'accès à l'école, aux bourses et à la formation.",
  environnement: "Améliorer le cadre de vie dans et autour des camps militaires.",
  sante: "Santé sexuelle et reproductive des femmes des camps militaires.",
};

const MARQUEE_WORDS = ["Protéger", "Accompagner", "Éduquer", "Autonomiser", "Défendre", "Plaider"];

export default async function HomePage() {
  const { locale, t } = await getTranslations();
  const p = t.pages.home;
  const media = await getSiteMedia();
  const site = await getSiteConfig();
  const testimonials = (await getPublishedTestimonials()).slice(0, 3);
  const activeLive = await getActiveLiveEventCached();
  const countryLabel = locale === "en" ? "Democratic Republic of the Congo" : site.country;

  const liveThumb = await getResolvedLiveThumb(activeLive?.thumbnail);
  const testimonialPhotos = await Promise.all(
    testimonials.map((item, i) =>
      getResolvedTestimonialPhoto(Boolean(item.anonymous), i, item.photo)
    )
  );
  const liveHref = activeLive ? `/live/${activeLive.slug}` : "/live";

  return (
    <>
      {/* Section 1 — Hero */}
      <HomeHero
        image={media.heroImage}
        imageAlt={media.heroImageAlt}
        video={media.heroVideo || undefined}
        poster={media.heroPoster}
        kicker={`ASBL · ${countryLabel}`}
        subtitle="Défendre les droits des dépendants des militaires — conjoints, veuves, orphelins et enfants — dans les 26 provinces de la RDC."
        liveHref={liveHref}
        hasLive={Boolean(activeLive)}
        liveLabel={p.heroCtaLive ?? "Rejoindre le live"}
        helpLabel={p.heroCtaHelp ?? "Demander de l'aide"}
        liveBadgeLabel={locale === "en" ? "Live" : "En direct"}
        helpHref="/contact#aide"
      />

      {/* Bandeau marquee */}
      <div className="overflow-hidden whitespace-nowrap bg-site-primary py-3.5">
        <div className="inline-flex" style={{ animation: "mq 32s linear infinite", willChange: "transform" }}>
          {[0, 1].map((dup) => (
            <span key={dup} className="inline-flex items-center gap-9 pr-9" aria-hidden={dup === 1}>
              {MARQUEE_WORDS.map((w) => (
                <span key={w} className="inline-flex items-center gap-9">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                    {w}
                  </span>
                  <span className="text-site-light">◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Section 2 — Chiffres */}
      <HomeStats
        stats={[
          { value: site.founded ?? 2018, label: locale === "en" ? "Year founded" : "Année de fondation" },
          { value: 26, label: locale === "en" ? "Provinces covered" : "Provinces couvertes" },
          { text: "FIKIN", label: locale === "en" ? "Gathering 2025" : "Rassemblement 2025" },
        ]}
      />

      {/* Section 3 — Mission */}
      <section className="mx-auto max-w-site px-6 py-[104px]">
        <div className="grid items-center gap-16 lg:grid-cols-2">
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
                {locale === "en" ? "Our mission" : "Notre mission"}
              </p>
              <h2 className="mt-3.5 font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.08] text-site-ink">
                Derrière chaque uniforme, un visage de famille
              </h2>
              <p className="mt-5 max-w-[52ch] text-[17px] leading-[1.7] text-site-muted">
                Fondée en {site.founded ?? 2018} par {site.founder ?? "Ngonga Mbana Glody"}, CFM analyse les
                faiblesses liées au social et aux secteurs de la vie courante des dépendants des militaires,
                et porte leur plaidoyer devant les instances nationales et internationales.
              </p>
              <Link
                href="/a-propos"
                className="mt-[22px] inline-flex items-center gap-2 border-b-2 border-site-primary pb-1.5 text-[15px] font-semibold text-site-primary"
              >
                {locale === "en" ? "Our story" : "Notre histoire"} →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 4 — Axes */}
      <section className="border-y border-site-hairline bg-site-surface py-[104px]">
        <div className="mx-auto max-w-site px-6">
          <ScrollReveal>
            <div className="max-w-[640px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
                {locale === "en" ? "Our areas of action" : "Nos axes d'action"}
              </p>
              <h2 className="mt-3.5 font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.1] text-site-ink">
                Cinq domaines, un même combat
              </h2>
              <p className="mt-4 text-[17px] leading-[1.6] text-site-muted">
                Des solutions concrètes pour améliorer durablement le quotidien des dépendants des
                militaires. Cliquez un axe pour tout savoir.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal className="mt-12">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
              {AXES.map((axe) => {
                const Icon = AXIS_ICONS[axe.icon] ?? Heart;
                return (
                  <Link
                    key={axe.slug}
                    href={`/axes/${axe.slug}`}
                    className="group block border border-site-hairline bg-white p-[26px] transition-all duration-300 hover:-translate-y-1.5 hover:border-site-primary hover:shadow-site-hover"
                  >
                    <span className="mb-[18px] flex h-[38px] w-[38px] items-center justify-center bg-site-pale text-site-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mb-2 text-lg font-semibold text-site-ink">{axe.title}</h3>
                    <p className="mb-3.5 text-sm leading-[1.55] text-site-muted-2">
                      {AXIS_TEASERS[axe.slug] ?? axe.description}
                    </p>
                    <span className="text-[13px] font-semibold text-site-primary">
                      {locale === "en" ? "Discover" : "Découvrir"} →
                    </span>
                  </Link>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 5 — Live */}
      <section className="mx-auto max-w-site px-6 py-[104px]">
        <ScrollReveal>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Link
              href={liveHref}
              className="group relative block aspect-video overflow-hidden border border-site-hairline bg-[#0f1622]"
              data-cta="cta_live"
            >
              <Image
                src={liveThumb}
                alt={activeLive?.title || "Événements live CFM"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <span className="absolute left-3.5 top-3.5 inline-flex animate-live-pulse items-center gap-1.5 bg-site-live px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.04em] text-white">
                <span className="h-1.5 w-1.5 bg-white" aria-hidden />
                {activeLive ? (locale === "en" ? "Live" : "En direct") : "Replay"}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-[74px] w-[74px] items-center justify-center bg-white text-site-ink shadow-[0_8px_30px_rgba(0,0,0,.3)] transition group-hover:scale-105">
                  <Play className="h-7 w-7 fill-current" aria-hidden />
                </span>
              </span>
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
                {locale === "en" ? "Live & events" : "Live & événements"}
              </p>
              <h2 className="mt-3.5 font-serif text-[clamp(26px,4vw,40px)] font-medium leading-[1.1] text-site-ink">
                {activeLive?.title ?? "FIKIN 2025 — Rassemblement des familles militaires"}
              </h2>
              <p className="mt-[18px] max-w-[50ch] text-[17px] leading-[1.7] text-site-muted">
                {activeLive?.description ??
                  "Revivez le rassemblement historique des familles de militaires à la Foire Internationale de Kinshasa. Diffusions, temps forts et échanges avec la communauté."}
              </p>
              <MagneticLink
                href={liveHref}
                className="mt-[26px] inline-flex items-center gap-2.5 bg-site-primary px-[26px] py-4 text-[15px] font-semibold text-white hover:bg-site-primary-dark"
                data-cta="cta_live"
              >
                <span className="h-2 w-2 bg-site-live" aria-hidden />
                {locale === "en" ? "Watch the replay" : "Voir le replay"}
              </MagneticLink>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 6 — Témoignages */}
      <section className="bg-site-deep py-[104px] text-white">
        <div className="mx-auto max-w-site px-6">
          <ScrollReveal>
            <div className="max-w-[640px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-light">
                {locale === "en" ? "Testimonials" : "Témoignages"}
              </p>
              <h2 className="mt-3.5 font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.1] text-white">
                {locale === "en" ? "Voices that can no longer be ignored" : "Des voix qu'on ne peut plus ignorer"}
              </h2>
            </div>
          </ScrollReveal>
          {testimonials.length > 0 && (
            <ScrollReveal className="mt-11">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
                {testimonials.map((item, i) => (
                  <figure
                    key={i}
                    className="border border-white/12 bg-white/5 p-8"
                  >
                    <Quote className="h-[30px] w-[30px] text-site-light" aria-hidden />
                    <blockquote className="mt-4 text-lg leading-[1.6] text-white/90">
                      {item.content}
                    </blockquote>
                    <figcaption className="mt-[22px] flex items-center gap-3.5">
                      {testimonialPhotos[i] ? (
                        <Image
                          src={testimonialPhotos[i]}
                          alt={item.photo_alt || ""}
                          width={46}
                          height={46}
                          className="h-[46px] w-[46px] flex-none border border-white/15 object-cover"
                        />
                      ) : (
                        <span
                          className="h-[46px] w-[46px] flex-none border border-white/15"
                          style={{
                            background:
                              "repeating-linear-gradient(135deg,#1d3a6b,#1d3a6b 6px,#274a80 6px,#274a80 12px)",
                          }}
                          aria-hidden
                        />
                      )}
                      <span>
                        <span className="block text-[15px] font-semibold text-white">
                          {item.anonymous ? "Anonyme" : item.author || "Membre CFM"}
                        </span>
                        {item.role && (
                          <span className="mt-1 block text-[13px] text-white/60">{item.role}</span>
                        )}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Section 7 — CTA + Newsletter */}
      <section className="py-[104px]">
        <div className="mx-auto max-w-site px-6">
          <ScrollReveal>
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <div>
                <h2 className="font-serif text-[clamp(30px,4.5vw,48px)] font-medium leading-[1.06] text-site-ink">
                  {locale === "en" ? "Join the movement" : "Rejoignez le mouvement"}
                </h2>
                <p className="mt-[18px] max-w-[48ch] text-[17px] leading-[1.65] text-site-muted">
                  Adhérez, soutenez ou devenez bénévole pour défendre les droits des familles militaires à
                  travers la RDC.
                </p>
                <div className="mt-[30px] flex flex-wrap gap-3">
                  <MagneticLink
                    href="/s-engager"
                    className="inline-flex items-center justify-center bg-site-primary px-[30px] py-4 text-[15px] font-semibold text-white hover:bg-site-primary-dark"
                    data-cta="cta_adhesion"
                  >
                    {locale === "en" ? "Become a member" : "Adhérer"}
                  </MagneticLink>
                  <Link
                    href="/s-engager#don"
                    className="inline-flex items-center justify-center border border-site-ink px-7 py-[15px] text-[15px] font-semibold text-site-ink transition hover:bg-site-ink hover:text-white"
                    data-cta="cta_don"
                  >
                    {locale === "en" ? "Make a donation" : "Faire un don"}
                  </Link>
                </div>
              </div>
              <div className="border border-site-hairline bg-site-surface p-[34px]">
                <h3 className="font-serif text-[22px] font-medium leading-[1.1] text-site-ink">
                  {locale === "en" ? "Stay informed" : "Restez informé·e"}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.5] text-site-muted">
                  {locale === "en"
                    ? "Get our news, campaigns and live announcements."
                    : "Recevez nos actualités, campagnes et annonces de live."}
                </p>
                <div className="mt-[18px]">
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
