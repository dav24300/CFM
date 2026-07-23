"use client";

import { useSyncExternalStore } from "react";

/**
 * Équivalent local de `useReducedMotion` de framer-motion.
 *
 * Huit composants n'importaient la bibliothèque (≈40 kB gzip) que pour ce seul
 * hook, ce qui la faisait entrer dans le bundle de toutes les pages publiques.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  // Safari < 14 n'expose pas addEventListener sur MediaQueryList.
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

// Côté serveur, on ne peut pas connaître la préférence : on suppose
// "animations autorisées" et le client corrige à l'hydratation.
function getServerSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
