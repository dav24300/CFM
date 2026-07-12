"use client";

import { createContext, useContext } from "react";
import type { Locale, Messages } from "@/lib/i18n";

type I18nValue = { locale: Locale; t: Messages };

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Fournit à l'arbre client le dictionnaire de LA locale courante, déjà fusionné
 * avec les overrides admin côté serveur (P3.3).
 *
 * Bénéfices vs l'ancien useTranslations (import statique des 4 JSON + lecture
 * cookie côté client) :
 * - le bundle client ne contient plus qu'une locale (celle sérialisée dans le
 *   payload RSC), au lieu des 4 langues complètes ;
 * - les overrides i18n édités en admin s'appliquent AUSSI aux composants client
 *   (formulaires, carte…), plus seulement au rendu serveur.
 */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslations doit être utilisé sous <I18nProvider>");
  }
  return ctx;
}
