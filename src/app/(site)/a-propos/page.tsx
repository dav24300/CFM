import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "@/lib/i18n-server";
import { getSiteConfig, getAboutTimeline } from "@/lib/site-config.server";
import { getResolvedAboutMedia, getResolvedGallery, getResolvedNewsCover } from "@/lib/media.server";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ImageGallery } from "@/components/ui/ImageGallery";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.about.title };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const site = await getSiteConfig();
  const gallery = await getResolvedGallery();
  const defaultHero = await getResolvedNewsCover(null);
  const aboutMedia = await getResolvedAboutMedia();
  const timelineRaw = await getAboutTimeline(locale);
  const timeline = timelineRaw.map((item) => ({
    ...item,
    image: item.image || (item.date === "2025" ? gallery[0]?.src : undefined),
  }));

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: "Accueil", href: "/" }, { label: "À propos" }]}
        kicker="Qui sommes-nous"
        title="Une ASBL née d’un cri, portée par une famille"
        subtitle={site.tagline}
        image={gallery[0]?.src || defaultHero}
        imageAlt="FIKIN 2025 — rassemblement CFM"
      />

      {/* Histoire */}
      <section className="mx-auto max-w-site px-6 py-24">
        <ScrollReveal>
          <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="media-frame relative aspect-[4/5]">
              <Image src={aboutMedia.founder} alt={site.founder} fill className="object-cover" sizes="400px" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
                Notre histoire
              </p>
              <h2 className="mt-3.5 font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.12] text-site-ink">
                D’un vécu au combat de toute une communauté
              </h2>
              <p className="mt-5 text-[17px] leading-[1.75] text-site-muted">
                L’ASBL <strong className="text-site-ink">{site.name} ({site.sigle})</strong> a été fondée
                en <strong className="text-site-ink">{site.founded}</strong> par{" "}
                <strong className="text-site-ink">{site.founder}</strong>, fils de militaire de père et de
                mère, ayant grandi dans le système militaire.
              </p>
              <p className="mt-4 text-[17px] leading-[1.75] text-site-muted">
                Après ses études, il a créé cette organisation pour analyser les faiblesses sociales des
                dépendants des militaires et produire des études de nécessité nationale.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Parcours */}
      <section className="border-y border-site-hairline bg-site-surface py-[88px]">
        <div className="mx-auto max-w-site px-6">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
              Notre parcours
            </p>
            <h2 className="mb-11 mt-3.5 font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.1] text-site-ink">
              De {site.founded} à aujourd’hui
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="relative">
              <div className="absolute left-0 right-0 top-[6px] hidden h-0.5 bg-[#e0e4ea] sm:block" aria-hidden />
              <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {timeline.map((item, i) => (
                  <div key={`${item.date}-${i}`}>
                    <div
                      className={`mb-5 h-3.5 w-3.5 ${item.date === "2025" ? "bg-site-live" : "bg-site-primary"}`}
                      aria-hidden
                    />
                    <div className="font-serif text-2xl font-medium leading-none text-site-ink">
                      {item.date}
                    </div>
                    <p className="mt-2 text-sm leading-[1.55] text-site-muted-2">
                      {item.description ?? item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FIKIN + galerie */}
      <section className="mx-auto max-w-site px-6 py-24">
        <ScrollReveal>
          <div className="border-l-[3px] border-site-light bg-site-deep px-10 py-12 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-light">
              FIKIN 2025 — un moment fondateur
            </p>
            <h2 className="mt-3.5 max-w-[24ch] font-serif text-[clamp(24px,3.2vw,34px)] font-medium leading-[1.15] text-white">
              Le jour où les familles militaires ont fait entendre leur voix
            </h2>
            <p className="mt-[18px] max-w-[70ch] text-base leading-[1.7] text-white/80">
              En 2025, CFM a organisé un rassemblement historique des familles de militaires à la Foire
              Internationale de Kinshasa (FIKIN). Veuves, orphelins, conjoints et enfants ont porté
              collectivement la voix de ceux dont le quotidien porte le vrai visage de la guerre.
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal className="mt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
            Galerie FIKIN 2025
          </p>
          <ImageGallery images={gallery} />
        </ScrollReveal>
      </section>

      {/* Vision + En bref */}
      <section className="border-t border-site-hairline bg-site-surface py-[88px]">
        <div className="mx-auto grid max-w-site gap-11 px-6 lg:grid-cols-[1.5fr_1fr]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
              Notre vision
            </p>
            <h2 className="mt-3.5 font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.12] text-site-ink">
              Un plaidoyer permanent, national et international
            </h2>
            <p className="mt-5 max-w-[56ch] text-[17px] leading-[1.75] text-site-muted">
              Nous plaidons auprès des instances nationales et internationales pour l’amélioration
              permanente des conditions de vie des dépendants des militaires.
            </p>
            <blockquote className="mt-7 max-w-[60ch] border-l-[3px] border-site-primary py-1.5 pl-[22px] font-serif text-[22px] italic leading-[1.5] text-site-ink">
              « {site.quote} »
            </blockquote>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="flex flex-col gap-4">
              <div className="bg-site-deep p-7 text-white">
                <h3 className="font-serif text-xl text-site-light">En bref</h3>
                <dl className="mt-[18px] flex flex-col gap-3.5 text-sm">
                  <InfoRow label="Sigle" value={site.sigle} />
                  <InfoRow label="Fondation" value={String(site.founded)} />
                  <InfoRow label="Fondateur" value={site.founder} />
                  <InfoRow label="Pays" value={site.country} />
                </dl>
              </div>
              <div className="border border-site-hairline bg-white p-7">
                <h3 className="font-serif text-xl text-site-ink">Gouvernance</h3>
                <p className="mt-3 text-[14.5px] leading-[1.6] text-site-muted-2">
                  CFM est dirigée par une équipe de bénévoles engagés, avec transparence financière pour
                  les donateurs.
                </p>
                <Link
                  href="/s-engager#transparence"
                  className="mt-3.5 inline-block border-b-2 border-site-primary pb-1 text-sm font-semibold text-site-primary"
                >
                  Transparence financière →
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-site px-6 py-[88px]">
        <ScrollReveal>
          <div className="border border-site-hairline px-10 py-14 text-center">
            <h2 className="mx-auto max-w-[20ch] font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.1] text-site-ink">
              Engagez-vous à nos côtés
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/s-engager"
                className="bg-site-primary px-[30px] py-4 text-[15px] font-semibold text-white transition hover:bg-site-primary-dark"
                data-cta="cta_adhesion"
              >
                S’engager avec nous
              </Link>
              <Link
                href="/contact"
                className="border border-site-ink px-7 py-[15px] text-[15px] font-semibold text-site-ink transition hover:bg-site-ink hover:text-white"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.04em] text-white/50">{label}</dt>
      <dd className="mt-1.5 font-semibold text-white">{value}</dd>
    </div>
  );
}
