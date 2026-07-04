import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

function revalidateMediaSettingsTag(): void {
  try {
    revalidateTag(CACHE_TAGS.mediaSettings);
  } catch (err) {
    // Dev Windows : chunk RSC manquant (.next stale) ne doit pas faire échouer l'upload.
    console.warn("[CFM] revalidateTag media-settings failed:", err);
  }
}

export function invalidateMediaCache(): void {
  try {
    after(revalidateMediaSettingsTag);
  } catch {
    revalidateMediaSettingsTag();
  }
}
