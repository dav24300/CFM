import { revalidateTag } from "next/cache";
import { CACHE_TAGS, tagForContentTable } from "@/infrastructure/cache/cache-tags";

export function invalidateContentCache(table?: string): void {
  try {
    if (table) {
      const tag = tagForContentTable(table);
      if (tag) revalidateTag(tag);
    }
    revalidateTag(CACHE_TAGS.content);
  } catch {
    // Hors contexte Next.js (tests, scripts CLI)
  }
}
