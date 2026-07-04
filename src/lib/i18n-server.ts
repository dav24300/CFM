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
  const locale = await getLocale();
  const base = getDictionary(locale);
  const overrides = await getI18nOverridesForLocale(locale);
  return { locale, t: applyI18nOverrides(base, overrides) };
}
