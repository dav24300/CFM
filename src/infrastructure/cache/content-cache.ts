import "server-only";
import { unstable_cache } from "next/cache";
import {
  getPublishedNews,
  getPublishedStudies,
  getActiveCampaigns,
  getPublishedTestimonials,
  getActions,
  getPublishedPressReleases,
} from "@/infrastructure/repositories/content.repository";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

function cached<T>(key: string, tags: string[], fn: () => T): () => Promise<T> {
  return unstable_cache(() => Promise.resolve(fn()), [key], {
    tags,
    revalidate: REVALIDATE_SECONDS,
  });
}

export const getPublishedNewsCached = cached(
  "cfm-published-news",
  [CACHE_TAGS.news, CACHE_TAGS.content],
  getPublishedNews
);

export const getPublishedStudiesCached = cached(
  "cfm-published-studies",
  [CACHE_TAGS.studies, CACHE_TAGS.content],
  getPublishedStudies
);

export const getActiveCampaignsCached = cached(
  "cfm-active-campaigns",
  [CACHE_TAGS.campaigns, CACHE_TAGS.content],
  getActiveCampaigns
);

export const getPublishedTestimonialsCached = cached(
  "cfm-published-testimonials",
  [CACHE_TAGS.testimonials, CACHE_TAGS.content],
  getPublishedTestimonials
);

export const getActionsCached = cached(
  "cfm-actions",
  [CACHE_TAGS.actions, CACHE_TAGS.content],
  getActions
);

export const getPublishedPressReleasesCached = cached(
  "cfm-press-releases",
  [CACHE_TAGS.press, CACHE_TAGS.content],
  getPublishedPressReleases
);
