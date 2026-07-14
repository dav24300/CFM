"use client";

import { useEffect, useState } from "react";

// Cache module : une seule requête de capacités pour tous les slots/sections.
let cached: boolean | null = null; // null = pas encore résolu
let inflight: Promise<boolean> | null = null;

/**
 * Disponibilité du stockage média (Supabase Storage).
 * `null` = inconnu (on ne bloque pas) ; `false` = mode démo (upload désactivé).
 */
export function useStorageAvailable(): boolean | null {
  const [value, setValue] = useState<boolean | null>(cached);

  useEffect(() => {
    if (cached !== null) {
      setValue(cached);
      return;
    }
    if (!inflight) {
      inflight = fetch("/api/admin/media/upload-capabilities")
        .then((r) => r.json())
        .then((d) => d.storageAvailable !== false)
        .catch(() => true);
    }
    let alive = true;
    inflight.then((v) => {
      cached = v;
      if (alive) setValue(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  return value;
}
