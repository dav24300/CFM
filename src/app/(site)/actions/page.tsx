"use client";



import { useEffect, useState } from "react";

import { MapPin, Calendar } from "lucide-react";

import Image from "next/image";

import { PageHero } from "@/components/ui/PageHero";
import { RDCMap } from "@/components/ui/RDCMap";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AsyncBoundary } from "@/components/ui/patterns/async-boundary";
import { EmptyState } from "@/components/ui/patterns/empty-state";
import { SkeletonList } from "@/components/ui/primitives/skeleton";

import { MEDIA, getNewsCoverImage, resolveMediaPath } from "@/lib/media";

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



export default function ActionsPage() {

  const { locale, t } = useTranslations();

  const p = t.pages.actions;

  const [actions, setActions] = useState<Action[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    fetch("/api/actions")

      .then((r) => r.json())

      .then((data) => {

        setActions(data);

        setLoading(false);

      })

      .catch(() => setLoading(false));

  }, []);



  const provincesWithActions = [...new Set(actions.map((a) => a.province))];

  const filtered = selectedProvince

    ? actions.filter((a) => a.province === selectedProvince)

    : actions;



  return (

    <>

      <PageHero

        title={p.title}

        subtitle={p.subtitle}

        image={resolveMediaPath(MEDIA.fikinGallery[3]?.src ?? MEDIA.fikinGallery[0].src)}

        imageAlt={p.heroAlt}

      />



      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">

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
              isLoading={loading}
              isEmpty={!loading && filtered.length === 0}
              loading={<SkeletonList count={3} variant="card" />}
              empty={
                <EmptyState
                  variant="card"
                  icon={<MapPin className="h-12 w-12 text-cfm-gold/50" aria-hidden />}
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

                            src={action.photo ? resolveMediaPath(action.photo) : getNewsCoverImage()}

                            alt={action.title}

                            fill

                            className="object-cover"

                            sizes="300px"

                          />

                        </div>

                        <div className="p-5 md:col-span-2">

                          <div className="flex flex-wrap items-start justify-between gap-2">

                            <div>

                              <span className="rounded-full bg-cfm-cream px-3 py-1 text-xs font-semibold text-cfm-gold">

                                {p.types[action.type] || action.type}

                              </span>

                              <h3 className="mt-2 font-display text-xl font-bold">{action.title}</h3>

                            </div>

                            <div className="flex items-center gap-1 text-sm text-cfm-earth">

                              <MapPin className="h-4 w-4" aria-hidden />

                              {action.province}

                            </div>

                          </div>

                          {action.description && (

                            <p className="mt-2 text-cfm-earth">{action.description}</p>

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

      </div>

    </>

  );

}

