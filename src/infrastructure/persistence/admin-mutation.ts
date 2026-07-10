import type { Store } from "@/domain/entities/store";
import type { ContentTable } from "@/infrastructure/cache/cache-tags";
import { invalidateContentCache } from "@/infrastructure/cache/invalidate";
import { invalidateMediaCache } from "@/infrastructure/cache/invalidate-media";
import { invalidateI18nCache } from "@/infrastructure/cache/invalidate-i18n";
import { invalidateSiteConfigCache } from "@/infrastructure/cache/invalidate-site-config";
import { updateStoreAsync } from "@/infrastructure/persistence/store-access";

type InvalidateKind = "content" | "media" | "i18n" | "site-config" | "none";

type Options = {
  invalidate?: InvalidateKind;
  contentTable?: ContentTable | string;
};

export async function withStoreMutation(
  mutator: (store: Store) => void,
  options: Options = {}
): Promise<Store> {
  const store = await updateStoreAsync(mutator);
  const { invalidate = "none", contentTable } = options;
  if (invalidate === "content") {
    invalidateContentCache(contentTable);
  } else if (invalidate === "media") {
    invalidateMediaCache();
  } else if (invalidate === "i18n") {
    invalidateI18nCache();
  } else if (invalidate === "site-config") {
    invalidateSiteConfigCache();
  }
  return store;
}

const MEDIA_SETTING_PREFIXES = ["hero_", "default_", "mission_", "fikin_", "axis_", "press_kit", "og_image", "favicon", "axes_hero"];

export function invalidateSettingsPatch(patch: Record<string, string>): void {
  const keys = Object.keys(patch);
  if (
    keys.some(
      (k) =>
        MEDIA_SETTING_PREFIXES.some((p) => k.startsWith(p) || k.includes(p)) ||
        k === "media_catalog" ||
        k === "fikin_gallery" ||
        k === "axis_images"
    )
  ) {
    invalidateMediaCache();
  }
  if (keys.some((k) => k.startsWith("site_") || k === "content_blocks" || k === "social_links")) {
    invalidateSiteConfigCache();
  }
  if (keys.includes("i18n_overrides")) {
    invalidateI18nCache();
  }
}
