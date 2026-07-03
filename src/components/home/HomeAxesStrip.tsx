"use client";

import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type Axe = {
  slug: string;
  title: string;
  description: string;
  image: string;
};

type Props = {
  axes: Axe[];
};

export function HomeAxesStrip({ axes }: Props) {
  return (
    <div className="scroll-snap-x -mx-4 mt-10 flex gap-4 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-5">
      {axes.map((axe, i) => (
        <ScrollReveal key={axe.slug} delay={i * 0.06} className="scroll-snap-item min-w-[75vw] shrink-0 md:min-w-0">
          <Link
            href={`/axes#${axe.slug}`}
            className="card-media image-zoom-hover group block h-full"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={axe.image}
                alt={axe.title}
                fill
                className="zoom-target object-cover"
                sizes="220px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cfm-navy/90 via-cfm-navy/20 to-transparent" />
              <div className="absolute bottom-0 p-4 text-white">
                <h3 className="font-display text-lg font-bold">{axe.title}</h3>
                <p className="mt-1 text-xs text-gray-200 line-clamp-2">{axe.description}</p>
              </div>
            </div>
          </Link>
        </ScrollReveal>
      ))}
    </div>
  );
}
