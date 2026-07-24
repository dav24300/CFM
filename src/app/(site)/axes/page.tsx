import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Briefcase, BookOpen, Leaf, Activity } from "lucide-react";
import { AXES } from "@/lib/constants";
import { getAxesHeroImageCached as getAxesHeroImage } from "@/infrastructure/cache/media-cache";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getTranslationsFor } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsFor("fr");
  return { title: t.pages.axes.title };
}

const iconMap = {
  heart: Heart,
  briefcase: Briefcase,
  book: BookOpen,
  leaf: Leaf,
  activity: Activity,
};

export default async function AxesPage() {
  const { locale } = await getTranslationsFor("fr");
  const axesHero = await getAxesHeroImage();
  const isEn = locale === "en";

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: isEn ? "Home" : "Accueil", href: "/" }, { label: isEn ? "Our areas" : "Nos axes" }]}
        kicker={isEn ? "Our areas of action" : "Nos axes d'action"}
        title="Cinq domaines, un même combat"
        subtitle="CFM propose des solutions pragmatiques pour améliorer de manière permanente le social, l'économie, l'éducation, l'environnement et la santé des dépendants des militaires."
        image={axesHero}
        imageAlt={isEn ? "Our areas of action" : "Nos axes d'action"}
        showBar
      />

      <section className="mx-auto max-w-site px-6 py-24">
        <ScrollReveal>
          <div className="grid gap-5 md:grid-cols-2">
            {AXES.map((axe, i) => {
              const Icon = iconMap[axe.icon as keyof typeof iconMap] ?? Heart;
              return (
                <Link
                  key={axe.slug}
                  href={`/axes/${axe.slug}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 border border-site-hairline bg-white p-[34px] transition-all duration-300 hover:-translate-y-1 hover:border-site-primary hover:shadow-site-hover"
                >
                  <span className="flex h-14 w-14 items-center justify-center bg-site-pale text-site-primary">
                    <Icon className="h-[26px] w-[26px]" aria-hidden />
                  </span>
                  <span>
                    <span className="mb-2 block font-mono text-[13px] text-site-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="mb-1.5 font-serif text-[26px] font-medium leading-[1.1] text-site-ink">
                      {axe.title}
                    </h2>
                    <p className="text-[14.5px] leading-[1.55] text-site-muted-2">{axe.description}</p>
                  </span>
                  <span className="text-[22px] text-site-primary transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              );
            })}

            {/* Cellule CTA */}
            <div className="flex flex-col justify-center bg-site-primary p-[34px] text-white">
              <h2 className="font-serif text-2xl font-medium leading-[1.15] text-white">
                Une cause, plusieurs manières d’agir
              </h2>
              <p className="mb-5 mt-3 text-[14.5px] leading-[1.55] text-white/80">
                Chaque axe est porté par des actions concrètes sur le terrain et un plaidoyer national.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/s-engager"
                  className="bg-white px-5 py-3 text-sm font-semibold text-site-primary transition hover:bg-white/90"
                >
                  {isEn ? "Get involved" : "S'engager"}
                </Link>
                <Link
                  href="/actions"
                  className="border border-white/60 px-[18px] py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-site-primary"
                >
                  {isEn ? "See our actions" : "Voir nos actions"}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
