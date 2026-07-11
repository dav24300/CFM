import {
  getStoreAsync,
  updateStoreAsync,
} from "@/infrastructure/persistence/store-access";

/** Tous les réglages du site (clé → valeur). */
export async function getSiteSettings(): Promise<Record<string, string>> {
  const store = await getStoreAsync();
  return store.site_settings;
}

/** Valeur d'un réglage du site (undefined si absent). */
export async function getSiteSetting(key: string): Promise<string | undefined> {
  const store = await getStoreAsync();
  return store.site_settings?.[key];
}

/**
 * Fusionne un patch partiel dans les réglages du site.
 * Les invalidations de cache éventuelles restent à la charge des appelants
 * (ex. invalidateSettingsPatch, invalidateI18nCache).
 */
export async function patchSiteSettings(
  patch: Record<string, string>
): Promise<void> {
  await updateStoreAsync((store) => {
    store.site_settings = { ...store.site_settings, ...patch };
  });
}
