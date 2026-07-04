import "server-only";
import { unstable_cache } from "next/cache";
import { getStoreAsync } from "@/infrastructure/persistence/store-access";
import type { Locale } from "@/lib/i18n";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

async function loadI18nOverrides(): Promise<Record<string, Record<string, string>>> {
  const store = await getStoreAsync();
  const raw = store.site_settings.i18n_overrides;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, Record<string, string>>;
  } catch {
    return {};
  }
}

export const getI18nOverridesCached = unstable_cache(
  loadI18nOverrides,
  ["cfm-i18n-overrides"],
  { tags: [CACHE_TAGS.i18n], revalidate: Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300) }
);

export async function getI18nOverridesForLocale(
  locale: Locale
): Promise<Record<string, string>> {
  const all = await getI18nOverridesCached();
  return all[locale] ?? {};
}

function setByPath(
  target: Record<string, unknown>,
  path: string,
  value: string
): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!cur[key] || typeof cur[key] !== "object") {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

export function applyI18nOverrides<T extends Record<string, unknown>>(
  base: T,
  overrides: Record<string, string>
): T {
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const out = structuredClone(base) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    setByPath(out, key, value);
  }
  return out as T;
}
