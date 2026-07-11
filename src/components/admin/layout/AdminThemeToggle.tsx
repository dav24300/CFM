"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

const COOKIE = "cfm-admin-theme";

/**
 * Bascule clair/sombre de la console admin. Écrit un cookie (lu au SSR par
 * admin/layout pour un rendu sans FOUC) et met à jour immédiatement la classe
 * `dark` sur le wrapper .theme-admin ET sur <body> (portails Radix).
 */
export function AdminThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.cookie.includes(`${COOKIE}=dark`)
  );

  function toggle() {
    const next = !dark;
    setDark(next);
    document.cookie = `${COOKIE}=${next ? "dark" : "light"}; path=/admin; max-age=31536000; samesite=lax`;
    document.querySelectorAll(".theme-admin").forEach((el) => el.classList.toggle("dark", next));
    document.body.classList.toggle("dark", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-2 text-sm text-admin-muted transition hover:bg-admin-bg"
      aria-label={dark ? "Passer en thème clair" : "Passer en thème sombre"}
      title={dark ? "Thème clair" : "Thème sombre"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
