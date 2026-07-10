"use client";

import { useState } from "react";
import { MapPin, Calendar } from "lucide-react";
import Image from "next/image";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { RDCMap } from "@/components/ui/RDCMap";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AsyncBoundary } from "@/components/ui/patterns/async-boundary";
import { EmptyState } from "@/components/ui/patterns/empty-state";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { SkeletonList } from "@/components/ui/primitives/skeleton";
import { resolveMediaPath } from "@/lib/media";
import { useTranslations } from "@/lib/i18n-client";
import { dateLocale } from "@/lib/i18n-supplement";

type Action = {
  id: number;
  province: string;
  title: string;
  description: string | null;
  date: string | null;
  type: string;
  photo?: string | null;
};

type Props = {
  heroImage: string;
  heroAlt: string;
  defaultCover: string;
  initialActions: Action[];
};

export function ActionsPageClient({ heroImage, heroAlt, defaultCover, initialActions }: Props) {
  const { locale, t } = useTranslations();
  const p = t.pages.actions;
  const [actions] = useState<Action[]>(initialActions);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const provincesWithActions = [...new Set(actions.map((a) => a.province))];
  const filtered = selectedProvince
    ? actions.filter((a) => a.province === selectedProvince)
    : actions;

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: locale === "en" ? "Home" : "Accueil", href: "/" }, { label: p.title }]}
        kicker={locale === "en" ? "On the ground" : "Sur le terrain"}
        title={p.title}
        subtitle={p.subtitle}
        image={heroImage}
        imageAlt={heroAlt}
      />

      <div className="mx-auto max-w-site px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <ScrollReveal direction="left">
            <RDCMap
              activeProvinces={provincesWithActions}
              selected={selectedProvince}
              onSelect={setSelectedProvince}
            />
          </ScrollReveal>

          <div className="lg:col-span-2">
            <AsyncBoundary
              isLoading={false}
              isEmpty={filtered.length === 0}
              loading={<SkeletonList count={3} variant="card" />}
              empty={
                <EmptyState
                  variant="card"
                  icon={<MapPin className="h-12 w-12 text-site-primary/50" aria-hidden />}
                  title={p.empty}
                />
              }
            >
              <div className="space-y-4">
                {filtered.map((action, i) => (
                  <ScrollReveal key={action.id} delay={i * 0.05}>
                    <article className="card-media overflow-hidden">
                      <div className="grid md:grid-cols-3">
                        <div className="relative aspect-video md:aspect-auto md:min-h-[140px]">
                          <Image
                            src={
                              action.photo
                                ? resolveMediaPath(action.photo)
                                : defaultCover
                            }
                            alt={action.title}
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                        </div>
                        <div className="p-5 md:col-span-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <span className="rounded-full bg-site-surface px-3 py-1 text-xs font-semibold text-site-primary">
                                {p.types[action.type] || action.type}
                              </span>
                              <h3 className="mt-2 font-serif text-xl font-bold">{action.title}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-site-muted">
                              <MapPin className="h-4 w-4" aria-hidden />
                              {action.province}
                            </div>
                          </div>
                          {action.description && (
                            <p className="mt-2 text-site-muted">{action.description}</p>
                          )}
                          {action.date && (
                            <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" aria-hidden />
                              {new Date(action.date).toLocaleDateString(dateLocale(locale), {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            </AsyncBoundary>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-site-primary/30 bg-site-surface p-6 text-center">
          <p className="font-medium text-site-ink">{t.ux.actions.provinceHelp}</p>
          <ButtonLink href="/contact#aide" size="sm" className="mt-4" data-cta="cta_aide">
            {t.ux.actions.provinceHelpCta}
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
