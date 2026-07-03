import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const val = cookieStore.get("cfm_locale")?.value;
  if (val === "en" || val === "ln" || val === "sw") return val;
  return "fr";
}

export async function getTranslations() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
