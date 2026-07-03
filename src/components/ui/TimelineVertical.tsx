"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";

type Event = {
  date: string;
  title: string;
  description?: string;
  image?: string;
};

type Props = {
  events: Event[];
};

export function TimelineVertical({ events }: Props) {
  return (
    <div className="relative space-y-10 pl-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-cfm-gold/30">
      {events.map((event, i) => (
        <ScrollReveal key={event.date + event.title} delay={i * 0.08}>
          <div className="relative">
            <span
              className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cfm-gold ring-4 ring-cfm-cream"
              aria-hidden
            >
              <span className="h-2 w-2 rounded-full bg-cfm-navy" />
            </span>
            <time className="text-sm font-semibold uppercase tracking-wide text-cfm-gold">
              {event.date}
            </time>
            <h3 className="mt-1 font-display text-xl font-bold text-cfm-navy">{event.title}</h3>
            {event.description && (
              <p className="mt-2 text-cfm-earth leading-relaxed">{event.description}</p>
            )}
            {event.image && (
              <div className="media-frame relative mt-4 aspect-video max-w-md">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
            )}
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
