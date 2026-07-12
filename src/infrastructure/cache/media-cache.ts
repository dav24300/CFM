import "server-only";
import { unstable_cache } from "next/cache";
import {
  getSiteMedia,
  getResolvedGallery,
  getResolvedAboutMedia,
  getPressKitPath,
  getOgImagePath,
  getFaviconPath,
  getActionsHeroImage,
  getAxesHeroImage,
  getResolvedAxisImage,
  getResolvedLiveThumb,
  getResolvedNewsCover,
  getResolvedTestimonialPhoto,
} from "@/infrastructure/media/media-resolution.server";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_MEDIA_CACHE_TTL ?? 300);

function cached<T>(key: string, fn: () => Promise<T>): () => Promise<T> {
  return unstable_cache(fn, [key], {
    tags: [CACHE_TAGS.mediaSettings],
    revalidate: REVALIDATE_SECONDS,
  });
}

export const getSiteMediaCached = cached("cfm-site-media", getSiteMedia);
export const getResolvedGalleryCached = cached("cfm-gallery", getResolvedGallery);
export const getResolvedAboutMediaCached = cached("cfm-about-media", getResolvedAboutMedia);
export const getPressKitPathCached = cached("cfm-press-kit", getPressKitPath);
export const getOgImagePathCached = cached("cfm-og-image", getOgImagePath);
export const getFaviconPathCached = cached("cfm-favicon", getFaviconPath);
export const getActionsHeroImageCached = cached("cfm-actions-hero", getActionsHeroImage);
export const getAxesHeroImageCached = cached("cfm-axes-hero", getAxesHeroImage);

// Wrappers `unstable_cache` construits UNE fois au niveau module.
// unstable_cache inclut automatiquement les arguments sérialisés de la
// fonction wrappée dans la clé de cache : les paramètres restent donc
// discriminants (même clé effective qu'avant : keyParts + args), mais le
// wrapper n'est plus reconstruit à chaque appel.
const resolveAxisImageCached = unstable_cache(
  (slug: string) => getResolvedAxisImage(slug),
  ["cfm-axis"],
  { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
);

const resolveLiveThumbCached = unstable_cache(
  (thumbnail: string) => getResolvedLiveThumb(thumbnail),
  ["cfm-live-thumb"],
  { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
);

const resolveNewsCoverCached = unstable_cache(
  (coverImage: string) => getResolvedNewsCover(coverImage),
  ["cfm-news-cover"],
  { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
);

const resolveTestimonialPhotoCached = unstable_cache(
  (anonymous: boolean, index: number, photo: string) =>
    getResolvedTestimonialPhoto(anonymous, index, photo),
  ["cfm-testimonial"],
  { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
);

export function getResolvedAxisImageCached(slug: string): Promise<string> {
  return resolveAxisImageCached(slug);
}

export function getResolvedLiveThumbCached(thumbnail?: string | null): Promise<string> {
  return resolveLiveThumbCached(thumbnail ?? "");
}

export function getResolvedNewsCoverCached(coverImage?: string | null): Promise<string> {
  return resolveNewsCoverCached(coverImage ?? "");
}

export function getResolvedTestimonialPhotoCached(
  anonymous: boolean,
  index: number,
  photo?: string | null
): Promise<string> {
  return resolveTestimonialPhotoCached(anonymous, index, photo ?? "");
}
