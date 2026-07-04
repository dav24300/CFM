import type { Metadata } from "next";
import Image from "next/image";
import {
  Heart,
  Briefcase,
  BookOpen,
  Leaf,
  Activity,
} from "lucide-react";
import { AXES } from "@/lib/constants";
import { getResolvedAxisImage } from "@/lib/media.server";
import { PageHero } from "@/components/ui/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getTranslations } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
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
  const { t } = await getTranslations();
  const p = t.pages.axes;
  const axisImages = Object.fromEntries(
    await Promise.all(
      AXES.map(async (axe) => [axe.slug, await getResolvedAxisImage(axe.slug)] as const)
    )
  );

  return (
    <>
      <PageHero
        title={p.title}
        subtitle={p.subtitle}
        image="/media/hero/hero-home.svg"
        imageAlt={p.heroAlt}
      />

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="space-y-24">
          {AXES.map((axe, index) => {
            const Icon = iconMap[axe.icon as keyof typeof iconMap];
            const imageFirst = index % 2 === 0;
            const content = t.axesContent[axe.slug] ?? {
              title: axe.title,
              description: axe.description,
              details: axe.details,
            };

            return (
              <ScrollReveal
                key={axe.slug}
                direction={imageFirst ? "left" : "right"}
              >
                <section
                  id={axe.slug}
                  className="scroll-mt-24 grid gap-10 lg:grid-cols-2 lg:items-center"
                >
                  <div className={imageFirst ? "" : "lg:order-2"}>
                    <div className="media-frame relative aspect-[4/3]">
                      <Image
                        src={axisImages[axe.slug]}
                        alt={content.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div className="absolute left-4 top-4 inline-flex rounded-lg bg-cfm-cream/95 p-3 text-cfm-gold shadow-cfm">
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                    </div>
                  </div>
                  <div className={imageFirst ? "" : "lg:order-1"}>
                    <h2 className="font-display text-3xl font-bold text-cfm-navy">{content.title}</h2>
                    <p className="mt-4 text-lg text-cfm-earth leading-relaxed">{content.description}</p>
                    <ul className="mt-6 space-y-2">
                      {content.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-cfm-earth">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cfm-gold" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </>
  );
}
