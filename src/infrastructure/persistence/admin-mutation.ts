import type { Store } from "@/domain/entities/store";
import type { ContentTable } from "@/infrastructure/cache/cache-tags";
import { invalidateContentCache } from "@/infrastructure/cache/invalidate";
import { invalidateMediaCache } from "@/infrastructure/cache/invalidate-media";
import { invalidateI18nCache } from "@/infrastructure/cache/invalidate-i18n";
import { updateStoreAsync } from "@/infrastructure/persistence/store-access";

type InvalidateKind = "content" | "media" | "i18n" | "none";

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
  }
  return store;
}
