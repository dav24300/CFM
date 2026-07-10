import "server-only";
import { unstable_cache } from "next/cache";
import { getActivePetitions } from "@/infrastructure/repositories/petitions.repository";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

export const getActivePetitionsCached = unstable_cache(
  getActivePetitions,
  ["cfm-petitions-active"],
  { tags: [CACHE_TAGS.petitions], revalidate: REVALIDATE_SECONDS }
);
