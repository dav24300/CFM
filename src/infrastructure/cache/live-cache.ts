import "server-only";
import { unstable_cache } from "next/cache";
import {
  getLiveEvents,
  getActiveLiveEvent,
  getLiveEventBySlug,
} from "@/infrastructure/repositories/live.repository";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

export const getLiveEventsCached = unstable_cache(
  getLiveEvents,
  ["cfm-live-events"],
  { tags: [CACHE_TAGS.live], revalidate: REVALIDATE_SECONDS }
);

export const getActiveLiveEventCached = unstable_cache(
  getActiveLiveEvent,
  ["cfm-live-active"],
  { tags: [CACHE_TAGS.live], revalidate: REVALIDATE_SECONDS }
);

export function getLiveEventBySlugCached(slug: string) {
  return unstable_cache(
    () => getLiveEventBySlug(slug),
    [`cfm-live-event-${slug}`],
    { tags: [CACHE_TAGS.live], revalidate: REVALIDATE_SECONDS }
  )();
}
