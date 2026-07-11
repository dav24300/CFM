"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
};

type Props = {
  images: readonly GalleryImage[];
};

/** Onglets d’album purement visuels — la galerie source ne porte pas d’album. */
const ALBUMS = ["Tout", "Rassemblements", "Terrain", "Ateliers"] as const;

const STRIPES =
  "repeating-linear-gradient(125deg,#16233d 0,#16233d 13px,#1d2c49 13px,#1d2c49 26px)";

export function MediaMosaic({ images }: Props) {
  const [album, setAlbum] = useState<(typeof ALBUMS)[number]>("Tout");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const goPrev = useCallback(
    () => setLightbox((i) => (i === null ? i : (i > 0 ? i - 1 : images.length - 1))),
    [images.length]
  );
  const goNext = useCallback(
    () => setLightbox((i) => (i === null ? i : (i < images.length - 1 ? i + 1 : 0))),
    [images.length]
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, goPrev, goNext]);

  const featured = images.slice(0, 2);
  const current = lightbox === null ? null : images[lightbox];

  return (
    <div>
      {/* À la une */}
      <div className="mb-6 grid gap-3.5 md:grid-cols-[2fr_1fr]">
        <a
          href="https://youtube.com/@cfmasbl"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block min-h-[300px] overflow-hidden bg-site-deep"
          aria-label="Ouvrir la chaîne YouTube CFM"
        >
          <span className="absolute inset-0" style={{ background: STRIPES }} aria-hidden />
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="flex h-[76px] w-[76px] items-center justify-center bg-white/95 text-site-deep shadow-[0_10px_34px_rgba(0,0,0,0.4)] transition group-hover:scale-105">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
          </span>
          <span className="absolute left-3.5 top-3.5 bg-site-live px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white">
            YouTube · À la une
          </span>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-[18px] pt-11">
            <span className="block font-serif text-xl font-medium leading-[1.25] text-white">
              FIKIN 2025 — le film du rassemblement
            </span>
            <span className="mt-1 block text-[12.5px] text-white/70">
              Vidéo · Chaîne YouTube CFM
            </span>
          </span>
        </a>

        <div className="flex flex-col gap-3.5">
          {featured.length > 0 ? (
            featured.map((img, i) => (
              <button
                key={`feat-${img.src}-${i}`}
                type="button"
                onClick={() => setLightbox(i)}
                className="group relative min-h-[143px] flex-1 overflow-hidden bg-site-surface text-left"
                aria-label={`Agrandir : ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3.5 pb-3 pt-8 text-[12.5px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {img.alt}
                </span>
              </button>
            ))
          ) : (
            <div className="min-h-[300px] flex-1 bg-site-surface" style={{ background: STRIPES }} />
          )}
        </div>
      </div>

      {/* Filtres d’album (visuels) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ALBUMS.map((a) => {
          const active = a === album;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAlbum(a)}
              aria-pressed={active}
              className={
                active
                  ? "border border-site-primary bg-site-primary px-[15px] py-2.5 text-[13px] font-semibold text-white"
                  : "border border-site-hairline bg-white px-[15px] py-2.5 text-[13px] font-semibold text-site-ink transition hover:border-site-primary hover:text-site-primary"
              }
            >
              {a}
            </button>
          );
        })}
      </div>

      {/* Mosaïque carrée */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative aspect-square overflow-hidden bg-site-surface text-left"
            aria-label={`Agrandir : ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-7 text-[12px] font-medium text-white opacity-0 transition group-hover:opacity-100">
              {img.alt}
            </span>
          </button>
        ))}
      </div>

      {/* Visionneuse */}
      {current && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[rgba(11,18,32,0.92)] p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse photo"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute right-5 top-[18px] text-white"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <div
            className="relative w-[min(960px,92vw)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-black">
              <Image src={current.src} alt={current.alt} fill className="object-contain" sizes="92vw" priority />
            </div>
            <p className="mt-4 text-center text-sm text-white/70">{current.alt}</p>
            {images.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Photo précédente"
                  className="border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Photo suivante"
                  className="border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
