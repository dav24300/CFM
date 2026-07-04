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

export function invalidateLiveCache(): void {
  try {
    revalidateTag(CACHE_TAGS.live);
  } catch {
    // Hors contexte Next.js
  }
}

export function invalidatePartnersCache(): void {
  try {
    revalidateTag(CACHE_TAGS.partners);
  } catch {
    // Hors contexte Next.js
  }
}

export function invalidatePetitionsCache(): void {
  try {
    revalidateTag(CACHE_TAGS.petitions);
  } catch {
    // Hors contexte Next.js
  }
}
