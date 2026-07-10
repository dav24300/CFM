import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

export function invalidateSiteConfigCache(): void {
  try {
    revalidateTag(CACHE_TAGS.siteConfig);
  } catch {
    // Hors contexte Next.js
  }
}
