"use client";

// Le dictionnaire client provient désormais du contexte alimenté par le serveur
// (I18nProvider dans le root layout) : plus d'import statique des 4 langues,
// et les overrides admin s'appliquent aux composants client (P3.3).
export { useI18n as useTranslations } from "@/components/i18n/I18nProvider";
