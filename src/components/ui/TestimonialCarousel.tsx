"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "./primitives/button";
import { EmptyState } from "./patterns/empty-state";

type Item = {
  content: string;
  author: string;
  role?: string | null;
  photo?: string;
  photoAlt?: string;
};

type Props = {
  items: Item[];
  prevLabel?: string;
  nextLabel?: string;
};

export function TestimonialCarousel({
  items,
  prevLabel = "Témoignage précédent",
  nextLabel = "Témoignage suivant",
}: Props) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      const child = track.children[clamped] as HTMLElement | undefined;
      child?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "start", block: "nearest" });
      setActiveIndex(clamped);
    },
    [items.length, reduceMotion]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
    }
    const track = trackRef.current;
    track?.addEventListener("keydown", onKeyDown);
    return () => track?.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, scrollToIndex]);

  if (items.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title="Aucun témoignage pour le moment"
        description="Revenez bientôt pour découvrir les voix des familles."
      />
    );
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="scroll-snap-x -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3"
        role="region"
        aria-roledescription="carousel"
        aria-label="Témoignages"
        tabIndex={0}
      >
        {items.map((item, i) => (
          <figure
            key={`${item.author}-${i}`}
            className="scroll-snap-item min-w-[85vw] shrink-0 rounded-xl bg-white/5 p-6 md:min-w-0"
            aria-hidden={i !== activeIndex ? true : undefined}
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-site-primary/40">
                <Image
                  src={item.photo || "/media/temoignages/portrait-01.svg"}
                  alt={item.photoAlt || item.author}
                  fill
                  className="object-cover"
                  sizes="56px"
                  style={
                    item.author === "Anonyme" || item.photoAlt?.includes("anonyme")
                      ? { filter: "blur(4px)" }
                      : undefined
                  }
                />
              </div>
              <figcaption className="text-sm text-site-primary">
                <span className="font-semibold text-white">{item.author}</span>
                {item.role && <span className="block text-site-primary/80">{item.role}</span>}
              </figcaption>
            </div>
            <blockquote className="italic text-gray-200">
              &laquo; {item.content} &raquo;
            </blockquote>
          </figure>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 md:hidden">
          <Button
            type="button"
            variant="outlineLight"
            size="sm"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label={prevLabel}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <div className="flex gap-2" role="tablist" aria-label="Pagination témoignages">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Témoignage ${i + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full transition",
                  i === activeIndex ? "bg-site-primary" : "bg-white/30"
                )}
                onClick={() => scrollToIndex(i)}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outlineLight"
            size="sm"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
            aria-label={nextLabel}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
