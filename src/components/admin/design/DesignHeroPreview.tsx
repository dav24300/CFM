"use client";

import Image from "next/image";

type Props = {
  image: string;
  video?: string;
  poster?: string;
  alt?: string;
};

export function DesignHeroPreview({ image, video, poster, alt }: Props) {
  const imageSrc = (poster || image).trim();
  const videoSrc = video?.trim() ?? "";

  return (
    <div className="sticky top-4 space-y-3">
      <p className="text-xs font-semibold uppercase text-admin-muted">Aperçu accueil</p>
      <div className="relative aspect-video overflow-hidden rounded-admin-card border border-admin-border bg-admin-deep shadow-admin-raised">
        {videoSrc ? (
          <video
            src={videoSrc}
            className="h-full w-full object-cover"
            muted
            loop
            autoPlay
            playsInline
            {...(imageSrc ? { poster: imageSrc } : {})}
          />
        ) : imageSrc ? (
          <Image
            src={imageSrc}
            alt={alt || "Hero"}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-admin-deep/80 text-sm text-admin-muted-2">
            Aucun média hero sélectionné
          </div>
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
