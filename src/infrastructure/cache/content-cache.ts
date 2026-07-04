import "server-only";
import { unstable_cache } from "next/cache";
import {
  getPublishedNewsAsync,
  getPublishedStudiesAsync,
  getActiveCampaignsAsync,
  getPublishedTestimonialsAsync,
  getActionsAsync,
  getPublishedPressReleasesAsync,
} from "@/infrastructure/repositories/content.repository";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

function cached<T>(key: string, tags: string[], fn: () => Promise<T>): () => Promise<T> {
  return unstable_cache(fn, [key], {
    tags,
    revalidate: REVALIDATE_SECONDS,
  });
}

export const getPublishedNewsCached = cached(
  "cfm-published-news",
  [CACHE_TAGS.news, CACHE_TAGS.content],
  getPublishedNewsAsync
);

export const getPublishedStudiesCached = cached(
  "cfm-published-studies",
  [CACHE_TAGS.studies, CACHE_TAGS.content],
  getPublishedStudiesAsync
);

export const getActiveCampaignsCached = cached(
  "cfm-active-campaigns",
  [CACHE_TAGS.campaigns, CACHE_TAGS.content],
  getActiveCampaignsAsync
);

export const getPublishedTestimonialsCached = cached(
  "cfm-published-testimonials",
  [CACHE_TAGS.testimonials, CACHE_TAGS.content],
  getPublishedTestimonialsAsync
);

export const getActionsCached = cached(
  "cfm-actions",
  [CACHE_TAGS.actions, CACHE_TAGS.content],
  getActionsAsync
);

export const getPublishedPressReleasesCached = cached(
  "cfm-press-releases",
  [CACHE_TAGS.press, CACHE_TAGS.content],
  getPublishedPressReleasesAsync
);
