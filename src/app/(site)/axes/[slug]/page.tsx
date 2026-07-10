import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Briefcase, BookOpen, Leaf, Activity, Quote } from "lucide-react";
import { AXES, SITE } from "@/lib/constants";
import { getActions } from "@/lib/db";
import { getActivePetitionsCached } from "@/infrastructure/cache/petitions-cache";
import { getResolvedAxisImage } from "@/lib/media.server";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MagneticLink } from "@/components/home/MagneticLink";

const iconMap = {
  heart: Heart,
  briefcase: Briefcase,
  book: BookOpen,
  leaf: Leaf,
  activity: Activity,
};

// Copie éditoriale par axe (cf. Axe-*.dc.html).
const AXIS_CONTENT: Record<
  string,
  { heroTitle: string; enjeuTitle: string; enjeuBody: string[] }
> = {
  social: {
    heroTitle: "Le social au cœur de notre combat",
    enjeuTitle: "Reconnaître le sacrifice, protéger la famille",
    enjeuBody: [
      "Derrière chaque militaire se trouve une famille dont le quotidien porte le vrai visage de la guerre. CFM identifie les faiblesses des dispositifs de protection et accompagne concrètement les personnes les plus vulnérables : veuves, orphelins, conjoints et enfants.",
      "Notre approche associe accompagnement de proximité et plaidoyer institutionnel, pour des résultats durables à l'échelle nationale.",
    ],
  },
  economique: {
    heroTitle: "L'autonomie économique comme levier",
    enjeuTitle: "De la vulnérabilité à l'indépendance",
    enjeuBody: [
      "Privées de ressources stables, de nombreuses veuves et conjoints de militaires basculent dans la précarité. CFM ouvre des voies vers l'autonomie : formation, microcrédit et accompagnement à l'entrepreneuriat.",
      "En renforçant les capacités économiques des familles, nous transformons la vulnérabilité en dynamique de développement local et durable.",
    ],
  },
  education: {
    heroTitle: "L'éducation, une promesse d'avenir",
    enjeuTitle: "Garantir l'école à chaque enfant",
    enjeuBody: [
      "Les enfants et orphelins de militaires voient trop souvent leur scolarité interrompue. CFM agit pour la scolarisation, les bourses et le soutien scolaire, afin qu'aucun enfant ne soit laissé de côté.",
      "Nous portons également un plaidoyer pour des politiques éducatives inclusives, adaptées à la réalité des familles militaires.",
    ],
  },
  environnement: {
    heroTitle: "Un cadre de vie digne pour les familles",
    enjeuTitle: "Améliorer l'habitat et le quotidien",
    enjeuBody: [
      "Dans et autour des camps militaires, les conditions d'habitat, d'eau et d'assainissement restent difficiles. CFM œuvre pour un cadre de vie décent et durable.",
      "Espaces verts, salubrité et qualité de vie : nous plaçons le bien-être des communautés militaires au cœur du développement.",
    ],
  },
  sante: {
    heroTitle: "La santé des femmes, une priorité",
    enjeuTitle: "Protéger la santé sexuelle et reproductive",
    enjeuBody: [
      "Dans les milieux des camps militaires, l'accès aux soins de santé reproductive reste limité. CFM sensibilise, prévient et facilite l'accès aux services adaptés.",
      "En formant des agents de santé communautaires, nous ancrons durablement la prévention au plus près des familles.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return AXES.map((axe) => ({ slug: axe.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const axe = AXES.find((a) => a.slug === slug);
  return { title: axe ? `Axe ${axe.title}` : "Axe" };
}

export default async function AxisDetailPage({ params }: Props) {
  const { slug } = await params;
  const index = AXES.findIndex((a) => a.slug === slug);
  const axe = AXES[index];
  if (!axe) notFound();

  const content = AXIS_CONTENT[slug] ?? {
    heroTitle: axe.title,
    enjeuTitle: axe.title,
    enjeuBody: [axe.description],
  };
  const Icon = iconMap[axe.icon as keyof typeof iconMap] ?? Heart;
  const axisNo = String(index + 1).padStart(2, "0");

  const [image, petitions, actions] = await Promise.all([
    getResolvedAxisImage(axe.slug),
    getActivePetitionsCached(),
    getActions(),
  ]);
  const petition = petitions[0] ?? null;
  const action = actions[0] ?? null;

  const impact = [
    { value: SITE.founded, label: "CFM agit depuis" },
    { value: 26, label: "Provinces couvertes" },
    petition
      ? { value: petition.goal, label: "Objectif pétition" }
      : { value: axe.details.length, label: "Priorités sur cet axe" },
  ];

  return (
    <>
      <InteriorHero
        minHeight="460px"
        breadcrumb={[
          { label: "Accueil", href: "/" },
          { label: "Nos axes", href: "/axes" },
          { label: axe.title },
        ]}
        image={image}
        imageAlt={axe.title}
        badge={
          <div className="flex items-center gap-4">
            <span className="flex h-[52px] w-[52px] items-center justify-center bg-site-primary text-white">
              <Icon className="h-[26px] w-[26px]" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9fbdf0]">
              Axe {axisNo} · {axe.title}
            </span>
          </div>
        }
        title={content.heroTitle}
        subtitle={axe.description}
        ctas={
          <>
            <Link
              href="/s-engager"
              className="bg-site-primary px-[26px] py-[15px] text-[15px] font-semibold text-white transition hover:bg-site-primary-dark"
            >
              S’engager
            </Link>
            <Link
              href="/s-engager#don"
              className="border border-white/60 px-6 py-[14px] text-[15px] font-semibold text-white transition hover:bg-white hover:text-site-ink"
              data-cta="cta_don"
            >
              Faire un don
            </Link>
          </>
        }
      />

      {/* Sous-nav entre axes */}
      <div className="sticky top-[68px] z-40 border-b border-site-hairline bg-white">
        <div className="mx-auto flex max-w-site gap-1.5 overflow-x-auto px-6">
          {AXES.map((a) => {
            const active = a.slug === slug;
            return (
              <Link
                key={a.slug}
                href={`/axes/${a.slug}`}
                className={`flex-none border-b-2 px-4 py-[18px] text-sm font-medium transition ${
                  active
                    ? "border-site-primary font-semibold text-site-primary"
                    : "border-transparent text-site-muted-2 hover:text-site-primary"
                }`}
              >
                {a.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Enjeu + impact */}
      <section className="mx-auto max-w-site px-6 py-[88px]">
        <ScrollReveal>
          <div className="grid items-start gap-16 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
                L’enjeu
              </p>
              <h2 className="mt-3.5 font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.12] text-site-ink">
                {content.enjeuTitle}
              </h2>
              {content.enjeuBody.map((para, i) => (
                <p key={i} className="mt-4 text-[17px] leading-[1.75] text-site-muted">
                  {para}
                </p>
              ))}
            </div>
            <div className="border border-site-hairline">
              {impact.map((tile, i) => (
                <div
                  key={tile.label}
                  className={`px-[26px] py-7 ${i < impact.length - 1 ? "border-b border-site-hairline" : ""}`}
                >
                  <div className="font-serif text-[40px] font-medium leading-none text-site-primary">
                    <AnimatedNumber value={tile.value} />
                  </div>
                  <div className="mt-1.5 text-xs font-medium uppercase tracking-[0.05em] text-site-muted-2">
                    {tile.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Priorités */}
      <section className="border-y border-site-hairline bg-site-surface py-[88px]">
        <div className="mx-auto max-w-site px-6">
          <ScrollReveal>
            <div className="max-w-[620px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
                Nos priorités
              </p>
              <h2 className="mt-3.5 font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.1] text-site-ink">
                Ce que nous faisons sur cet axe
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal className="mt-11">
            <div className="grid gap-4 sm:grid-cols-2">
              {axe.details.map((detail, i) => (
                <div key={detail} className="border border-site-hairline bg-white p-7">
                  <div className="font-mono text-sm text-site-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-3.5 text-[19px] font-semibold leading-[1.25] text-site-ink">
                    {detail}
                  </h3>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Sur le terrain */}
      <section className="mx-auto max-w-site px-6 py-[88px]">
        <ScrollReveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <h2 className="font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.1] text-site-ink">
              Sur le terrain
            </h2>
            <Link
              href="/actions"
              className="border-b-2 border-site-primary pb-1 text-sm font-semibold text-site-primary"
            >
              Toutes les actions →
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            {/* Carte action */}
            <article className="border border-site-hairline">
              <div className="relative aspect-video bg-[#0f1622]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(125deg,#232830 0,#232830 12px,#30363f 12px,#30363f 24px)",
                  }}
                  aria-hidden
                />
                <span className="absolute left-3 top-3 bg-site-primary px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
                  {action?.type || "Événement"}
                </span>
              </div>
              <div className="p-[26px]">
                <div className="text-xs font-medium uppercase tracking-[0.05em] text-site-muted-2">
                  {action ? `${action.province}${action.date ? ` · ${action.date}` : ""}` : "Kinshasa · 2025"}
                </div>
                <h3 className="mb-2 mt-2.5 font-serif text-[22px] font-medium leading-[1.2] text-site-ink">
                  {action?.title || "Rassemblement FIKIN 2025"}
                </h3>
                <p className="text-[15px] leading-[1.6] text-site-muted-2">
                  {action?.description ||
                    "Grand rassemblement des familles militaires à la Foire Internationale de Kinshasa."}
                </p>
              </div>
            </article>

            {/* Carte pétition */}
            <div className="flex flex-col justify-center bg-site-primary p-[34px] text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9fbdf0]">
                Pétition liée
              </p>
              <h3 className="mb-2.5 mt-3 font-serif text-2xl font-medium leading-[1.2] text-white">
                {petition?.title || "Réforme de la protection des familles militaires"}
              </h3>
              <p className="mb-5 text-[15px] leading-[1.6] text-white/80">
                {petition?.description ||
                  "Appelons le gouvernement à renforcer la protection sociale des dépendants des militaires."}
              </p>
              <Link
                href={petition ? `/petitions/${petition.slug}` : "/petitions"}
                className="self-start bg-white px-5 py-3 text-sm font-semibold text-site-primary transition hover:bg-white/90"
                data-cta="cta_petition"
              >
                Signer la pétition
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Galerie (emplacements média) */}
      <section className="mx-auto max-w-site px-6 pb-[88px]">
        <ScrollReveal>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
            Galerie
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((n) => (
              <div key={n} className="relative aspect-[4/3] border border-site-hairline">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg,#ededea 0,#ededea 10px,#f6f6f4 10px,#f6f6f4 20px)",
                  }}
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Citation fondateur */}
      <section className="bg-site-deep py-[88px] text-white">
        <div className="mx-auto max-w-[900px] px-6 text-center">
          <Quote className="mx-auto mb-2 h-[38px] w-[38px] text-site-light" aria-hidden />
          <p className="mx-auto max-w-[28ch] font-serif text-[32px] font-normal italic leading-[1.35] text-white">
            {SITE.quote}
          </p>
          <p className="mt-6 text-sm font-semibold text-site-light">
            {SITE.founder} — Fondateur, {SITE.sigle}
          </p>
        </div>
      </section>

      {/* CTA triple */}
      <section className="mx-auto max-w-site px-6 py-[88px]">
        <ScrollReveal>
          <div className="border border-site-hairline px-10 py-14 text-center">
            <h2 className="mx-auto max-w-[20ch] font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.1] text-site-ink">
              Agissez pour les familles militaires
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[17px] leading-[1.6] text-site-muted">
              Votre engagement change concrètement le quotidien des veuves, orphelins et enfants de
              militaires.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <MagneticLink
                href="/s-engager"
                className="bg-site-primary px-[30px] py-4 text-[15px] font-semibold text-white hover:bg-site-primary-dark"
                data-cta="cta_adhesion"
              >
                Adhérer
              </MagneticLink>
              <Link
                href="/s-engager#don"
                className="border border-site-ink px-7 py-[15px] text-[15px] font-semibold text-site-ink transition hover:bg-site-ink hover:text-white"
                data-cta="cta_don"
              >
                Faire un don
              </Link>
              <Link
                href="/contact#aide"
                className="border border-site-ink px-7 py-[15px] text-[15px] font-semibold text-site-ink transition hover:bg-site-ink hover:text-white"
                data-cta="cta_aide"
              >
                Demander de l’aide
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
