"use client";

import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie.match(/(?:^|;\s*)cfm_locale=(\w+)/);
  const val = match?.[1];
  if (val === "en" || val === "ln" || val === "sw") return val;
  return "fr";
}

export function useTranslations() {
  const [locale, setLocale] = useState<Locale>("fr");

  useEffect(() => {
    setLocale(readLocaleCookie());
  }, []);

  return { locale, t: getDictionary(locale) };
}
