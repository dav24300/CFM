import { pngToSvgFallback } from "@/lib/infra/media-resolver";

export const MEDIA = {
  hero: {
    image: "/media/hero/hero-home.png",
    imageMobile: "/media/hero/hero-home-mobile.png",
    poster: "/media/hero/hero-home.png",
    video: null as string | null,
  },
  mission: "/media/fikin-2025/rassemblement-02.png",
  axes: {
    social: "/media/axes/social.svg",
    economique: "/media/axes/economie.svg",
    education: "/media/axes/education.svg",
    environnement: "/media/axes/environnement.svg",
    sante: "/media/axes/sante.svg",
  },
  testimonials: {
    default: "/media/temoignages/portrait-01.svg",
    anonymous: "/media/temoignages/portrait-02.svg",
  },
  fikinGallery: [
    { src: "/media/fikin-2025/rassemblement-01.png", alt: "Affiche — Bientôt rassemblement des familles militaires" },
    { src: "/media/fikin-2025/rassemblement-02.png", alt: "Rassemblement CFM — familles militaires" },
    { src: "/media/fikin-2025/rassemblement-03.png", alt: "Notre Congo est et restera indivisible — CFM" },
    { src: "/media/fikin-2025/rassemblement-04.png", alt: "Mobilisation des familles militaires" },
  ],
  about: {
    founder: "/media/equipe/fondateur.png",
    team: "/media/equipe/benevoles.svg",
  },
  live: {
    defaultThumb: "/media/live/fikin-live-thumb.png",
  },
  news: {
    default: "/media/actualites/fikin-2025.png",
  },
} as const;

export type SiteMediaSettings = {
  heroImage: string;
  heroVideo: string | null;
  heroPoster: string;
  missionImage: string;
};

/** Fallback client/serveur : .png absent → .svg équivalent */
export function resolveMediaPath(publicPath: string): string {
  return pngToSvgFallback(publicPath);
}

export function getAxisImage(slug: string): string {
  const axes = MEDIA.axes as Record<string, string>;
  return resolveMediaPath(axes[slug] || MEDIA.mission);
}

export function getTestimonialPhoto(anonymous: boolean, index: number, photo?: string | null): string {
  if (photo) return resolveMediaPath(photo);
  if (anonymous) return resolveMediaPath(MEDIA.testimonials.anonymous);
  return resolveMediaPath(
    index % 2 === 0 ? MEDIA.testimonials.default : "/media/temoignages/portrait-02.svg"
  );
}

export function getNewsCoverImage(coverImage?: string | null): string {
  return resolveMediaPath(coverImage || MEDIA.news.default);
}

export function getLiveThumbnail(thumbnail?: string | null): string {
  return resolveMediaPath(thumbnail || MEDIA.live.defaultThumb);
}
