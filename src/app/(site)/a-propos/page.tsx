import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import { getTranslations } from "@/lib/i18n-server";
import { getResolvedAboutMedia, getResolvedGallery } from "@/lib/media.server";
import { PageHero } from "@/components/ui/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimelineVertical } from "@/components/ui/TimelineVertical";
import { ImageGallery } from "@/components/ui/ImageGallery";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.about.title };
}

export default async function AboutPage() {
  const { t } = await getTranslations();
  const a = t.pages.about;
  const gallery = getResolvedGallery();
  const aboutMedia = getResolvedAboutMedia();

  const timeline = [
    {
      date: "2018",
      title: "Fondation de CFM",
      description: `Création de l'ASBL par ${SITE.founder}, fils de militaires, avec la mission de défendre les droits des dépendants.`,
    },
    {
      date: "2020",
      title: "Premières actions terrain",
      description: "Lancement des programmes d'accompagnement social et économique dans plusieurs provinces.",
    },
    {
      date: "2025",
      title: "FIKIN — Rassemblement historique",
      description: "Grand rassemblement des familles militaires à la Foire Internationale de Kinshasa.",
      image: gallery[0].src,
    },
    {
      date: "2026",
      title: "Mobilisation numérique",
      description: "Live, PWA, notifications push et interface multilingue (FR, EN, LN, SW).",
    },
  ];

  return (
    <>
      <PageHero
        title={a.title}
        subtitle={SITE.tagline}
        image={gallery[0].src}
        imageAlt="FIKIN 2025 — rassemblement CFM"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            <ScrollReveal>
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div className="media-frame relative aspect-[4/5]">
                  <Image
                    src={aboutMedia.founder}
                    alt={SITE.founder}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-cfm-navy">{a.historyTitle}</h2>
                  <p className="mt-4 text-cfm-earth leading-relaxed">
                    L&apos;ASBL <strong>Cri de Familles Militaires (CFM)</strong> a été fondée en{" "}
                    <strong>{SITE.founded}</strong> par <strong>{SITE.founder}</strong>, fils de
                    militaire de père et de mère, ayant grandi dans le système militaire.
                  </p>
                  <p className="mt-4 text-cfm-earth leading-relaxed">
                    Après ses études, il a créé cette organisation pour analyser les faiblesses
                    sociales des dépendants des militaires et produire des études de nécessité
                    nationale.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="font-display text-2xl font-bold text-cfm-navy">Notre parcours</h2>
              <div className="mt-8">
                <TimelineVertical events={timeline} />
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="card border-l-4 border-cfm-gold">
                <h2 className="font-display text-2xl font-bold text-cfm-navy">{a.fikinTitle}</h2>
                <p className="mt-4 text-cfm-earth leading-relaxed">
                  En 2025, CFM a organisé un rassemblement historique des familles de militaires à la
                  Foire Internationale de Kinshasa (FIKIN). Veuves, orphelins, conjoints et enfants
                  ont porté collectivement la voix de ceux dont le quotidien porte le vrai visage de
                  la guerre.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="font-display text-2xl font-bold text-cfm-navy">Galerie FIKIN 2025</h2>
              <div className="mt-6">
                <ImageGallery images={gallery} />
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="font-display text-2xl font-bold text-cfm-navy">{a.visionTitle}</h2>
              <p className="mt-4 text-cfm-earth leading-relaxed">
                Nous plaidons auprès des instances nationales et internationales pour
                l&apos;amélioration permanente des conditions de vie des dépendants des militaires.
              </p>
              <blockquote className="mt-6 border-l-4 border-cfm-warm pl-4 italic text-cfm-navy">
                {SITE.quote}
              </blockquote>
            </ScrollReveal>
          </div>

          <aside className="space-y-6">
            <ScrollReveal delay={0.1}>
              <div className="card bg-cfm-navy text-white">
                <h3 className="font-display text-xl font-bold text-cfm-gold">En bref</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-400">Sigle</dt>
                    <dd className="font-semibold">{SITE.sigle}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Fondation</dt>
                    <dd className="font-semibold">{SITE.founded}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Fondateur</dt>
                    <dd className="font-semibold">{SITE.founder}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Pays</dt>
                    <dd className="font-semibold">{SITE.country}</dd>
                  </div>
                </dl>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div className="card">
                <h3 className="font-display text-xl font-bold">Gouvernance</h3>
                <p className="mt-2 text-sm text-cfm-earth">
                  CFM est dirigée par une équipe de bénévoles engagés, avec transparence financière
                  pour les donateurs.
                </p>
                <Link href="/s-engager#transparence" className="mt-4 inline-block text-sm font-semibold text-cfm-gold hover:underline">
                  Transparence financière →
                </Link>
              </div>
            </ScrollReveal>
          </aside>
        </div>
      </div>
    </>
  );
}
