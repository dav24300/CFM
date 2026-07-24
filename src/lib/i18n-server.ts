import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/lib/i18n";
import {
  applyI18nOverrides,
  getI18nOverridesForLocale,
} from "@/lib/i18n-overrides.server";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const val = cookieStore.get("cfm_locale")?.value;
  if (val === "en" || val === "ln" || val === "sw") return val;
  return "fr";
}

export async function getTranslations() {
  return getTranslationsFor(await getLocale());
}

/**
 * Traductions d'une locale explicite, SANS lecture de cookie.
 *
 * C'est l'appel à `cookies()` (via getLocale) qui rend dynamique tout ce qui en
 * dépend — à commencer par le layout racine, donc l'application entière. Le
 * site public passe par cette variante figée sur "fr" pour redevenir statique ;
 * le portail lui passe la locale réelle du membre (il est déjà dynamique).
 */
export async function getTranslationsFor(locale: Locale) {
  const base = getDictionary(locale);
  const overrides = await getI18nOverridesForLocale(locale);
  return { locale, t: applyI18nOverrides(base, overrides) };
}
