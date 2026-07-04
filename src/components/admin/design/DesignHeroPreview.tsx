"use client";

import Image from "next/image";

type Props = {
  image: string;
  video?: string;
  poster?: string;
  alt?: string;
};

export function DesignHeroPreview({ image, video, poster, alt }: Props) {
  return (
    <div className="sticky top-4 space-y-3">
      <p className="text-xs font-semibold uppercase text-cfm-earth">Aperçu accueil</p>
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-cfm-navy shadow-lg">
        {video ? (
          <video
            src={video}
            className="h-full w-full object-cover"
            muted
            loop
            autoPlay
            playsInline
            poster={poster || image}
          />
        ) : (
          <Image src={poster || image} alt={alt || "Hero"} fill className="object-cover" sizes="400px" />
        )}
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="font-display text-lg font-bold">CFM ASBL</p>
          <p className="text-xs opacity-90">Utilisé sur : / (accueil)</p>
        </div>
      </div>
    </div>
  );
}
