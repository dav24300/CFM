import messagesFrJson from "@/lib/i18n/messages/fr.json";
import messagesEnJson from "@/lib/i18n/messages/en.json";
import messagesLnJson from "@/lib/i18n/messages/ln.json";
import messagesSwJson from "@/lib/i18n/messages/sw.json";

export type Locale = "fr" | "en" | "ln" | "sw";

export const LOCALES: Locale[] = ["fr", "en", "ln", "sw"];

/**
 * Les 4 JSON de src/lib/i18n/messages/ sont l'UNIQUE source de vérité (P3).
 * Les anciens systèmes (traductions codées en dur dans ce fichier,
 * i18n-extra.ts, i18n-supplement.ts) ont été fusionnés dans les JSON via un
 * dump de la sortie runtime — les clés LN/SW non traduites portent la valeur
 * française (comportement de repli historique, désormais visible et mesurable
 * via `npm run i18n:check`).
 */
export type Messages = typeof messagesFrJson;

const jsonMessages: Record<Locale, Messages> = {
  fr: messagesFrJson,
  en: messagesEnJson,
  ln: messagesLnJson,
  sw: messagesSwJson,
};

export function getDictionary(locale: Locale): Messages {
  return jsonMessages[locale];
}

export function dateLocale(locale: Locale): string {
  if (locale === "en") return "en-US";
  if (locale === "sw") return "sw-KE";
  return "fr-FR";
}
