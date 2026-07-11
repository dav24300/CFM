import {
  getStoreAsync,
  updateStoreAsync,
} from "@/infrastructure/persistence/store-access";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlSettings from "@/infrastructure/repositories/sql/settings.sql";

/** Tous les réglages du site (clé → valeur). */
export async function getSiteSettings(): Promise<Record<string, string>> {
  if (isPgMode()) return sqlSettings.getAllSettings();
  const store = await getStoreAsync();
  return store.site_settings;
}

/** Valeur d'un réglage du site (undefined si absent). */
export async function getSiteSetting(key: string): Promise<string | undefined> {
  if (isPgMode()) return sqlSettings.getSetting(key);
  const store = await getStoreAsync();
  return store.site_settings?.[key];
}

/**
 * Fusionne un patch partiel dans les réglages du site (aucune clé supprimée).
 * Les invalidations de cache éventuelles restent à la charge des appelants
 * (ex. invalidateSettingsPatch, invalidateI18nCache).
 */
export async function patchSiteSettings(
  patch: Record<string, string>
): Promise<void> {
  if (isPgMode()) return sqlSettings.patchSettings(patch);
  await updateStoreAsync((store) => {
    store.site_settings = { ...store.site_settings, ...patch };
  });
}

/**
 * Read-modify-write atomique d'un réglage (ex. media_catalog) :
 * en PG la ligne est verrouillée (SELECT ... FOR UPDATE) le temps de la
 * mutation ; en JSON la mutation s'exécute dans updateStoreAsync (sérialisé).
 * mutateFn reçoit la valeur courante (undefined si la clé n'existe pas) et
 * retourne la nouvelle valeur.
 */
export async function mutateSiteSetting(
  key: string,
  mutateFn: (current: string | undefined) => string
): Promise<void> {
  if (isPgMode()) return sqlSettings.patchSettingWithinTransaction(key, mutateFn);
  await updateStoreAsync((store) => {
    store.site_settings[key] = mutateFn(store.site_settings[key]);
  });
}
