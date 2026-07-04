import "server-only";
import { unstable_cache } from "next/cache";
import {
  getSiteMedia,
  getResolvedGallery,
  getResolvedAxisImage,
  getResolvedAboutMedia,
  getResolvedLiveThumb,
  getResolvedNewsCover,
  getResolvedTestimonialPhoto,
  getPressKitPath,
  getOgImagePath,
  getFaviconPath,
  getActionsHeroImage,
} from "@/infrastructure/media/media-resolution.server";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_MEDIA_CACHE_TTL ?? 300);

function cached<T>(key: string, fn: () => T): () => Promise<T> {
  return unstable_cache(() => Promise.resolve(fn()), [key], {
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

export function getResolvedAxisImageCached(slug: string): Promise<string> {
  return unstable_cache(
    () => Promise.resolve(getResolvedAxisImage(slug)),
    [`cfm-axis-${slug}`],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getResolvedLiveThumbCached(thumbnail?: string | null): Promise<string> {
  const key = thumbnail || "default";
  return unstable_cache(
    () => Promise.resolve(getResolvedLiveThumb(thumbnail)),
    [`cfm-live-thumb-${key}`],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getResolvedNewsCoverCached(coverImage?: string | null): Promise<string> {
  const key = coverImage || "default";
  return unstable_cache(
    () => Promise.resolve(getResolvedNewsCover(coverImage)),
    [`cfm-news-cover-${key}`],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getResolvedTestimonialPhotoCached(
  anonymous: boolean,
  index: number,
  photo?: string | null
): Promise<string> {
  const key = `${anonymous}-${index}-${photo || "default"}`;
  return unstable_cache(
    () => Promise.resolve(getResolvedTestimonialPhoto(anonymous, index, photo)),
    [`cfm-testimonial-${key}`],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}
