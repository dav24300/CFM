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

export function getResolvedAxisImageCached(slug: string): Promise<string> {
  return unstable_cache(
    () => getResolvedAxisImage(slug),
    ["cfm-axis", slug],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getResolvedLiveThumbCached(thumbnail?: string | null): Promise<string> {
  return unstable_cache(
    () => getResolvedLiveThumb(thumbnail),
    ["cfm-live-thumb", thumbnail ?? ""],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getResolvedNewsCoverCached(coverImage?: string | null): Promise<string> {
  return unstable_cache(
    () => getResolvedNewsCover(coverImage),
    ["cfm-news-cover", coverImage ?? ""],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getResolvedTestimonialPhotoCached(
  anonymous: boolean,
  index: number,
  photo?: string | null
): Promise<string> {
  return unstable_cache(
    () => getResolvedTestimonialPhoto(anonymous, index, photo),
    ["cfm-testimonial", String(anonymous), String(index), photo ?? ""],
    { tags: [CACHE_TAGS.mediaSettings], revalidate: REVALIDATE_SECONDS }
  )();
}
