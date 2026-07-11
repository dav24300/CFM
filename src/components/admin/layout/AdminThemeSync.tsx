"use client";

import { useEffect } from "react";

/**
 * Réplique le thème admin sur <body> pendant la navigation dans /admin, afin que
 * les portails Radix (Dialog/Select, attachés à document.body hors du sous-arbre
 * .theme-admin) héritent bien du thème admin (teal + sombre) au lieu du thème site.
 * Nettoyé au démontage → le site public conserve son thème clair.
 */
export function AdminThemeSync({ dark }: { dark: boolean }) {
  useEffect(() => {
    const body = document.body;
    body.classList.add("theme-admin");
    body.classList.toggle("dark", dark);
    return () => {
      body.classList.remove("theme-admin", "dark");
    };
  }, [dark]);

  return null;
}
