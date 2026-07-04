import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

export function invalidateI18nCache(): void {
  try {
    revalidateTag(CACHE_TAGS.i18n);
  } catch {
    // Hors contexte Next.js
  }
}
