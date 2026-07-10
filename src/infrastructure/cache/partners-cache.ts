import "server-only";
import { unstable_cache } from "next/cache";
import { getAllPartners } from "@/infrastructure/repositories/partners.repository";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

export const getPartnersCached = unstable_cache(
  getAllPartners,
  ["cfm-partners"],
  { tags: [CACHE_TAGS.partners], revalidate: REVALIDATE_SECONDS }
);
