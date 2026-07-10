"use client";

import { useCallback } from "react";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import type { AdminStats, AdminData } from "@/components/admin/types";

export function useAdminApi(onReload?: () => void) {
  const { success, error } = useAdminToast();

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error(data.error || "Action refusée");
        return false;
      }
      success("Action enregistrée");
      onReload?.();
      return true;
    },
    [success, error, onReload]
  );

  return { post };
}

export type AdminLoadResult = {
  stats: AdminStats;
  data: AdminData;
  liveEvents: Record<string, unknown>[];
};

export async function loadAdminBundle(): Promise<AdminLoadResult | null> {
  const [statsRes, dataRes, liveRes] = await Promise.all([
    fetch("/api/admin", { credentials: "include" }),
    fetch("/api/admin/data", { credentials: "include" }),
    fetch("/api/admin/live", { credentials: "include" }),
  ]);

  if (
    statsRes.status === 401 ||
    dataRes.status === 401 ||
    liveRes.status === 401
  ) {
    return null;
  }

  if (!statsRes.ok || !dataRes.ok) {
    throw new Error("admin_bundle_load_failed");
  }

  const stats = await statsRes.json();
  const data = await dataRes.json();
  let liveEvents: Record<string, unknown>[] = [];
  if (liveRes.ok) {
    const liveData = await liveRes.json();
    liveEvents = liveData.events || [];
  }
  return { stats, data, liveEvents };
}
