"use client";

import { AlertTriangle } from "lucide-react";
import { useStorageAvailable } from "@/components/admin/design/useStorageAvailable";

/** Bannière « mode démo » quand le stockage média (Supabase) est indisponible. */
export function ServerlessUploadBanner() {
  const storage = useStorageAvailable();
  if (storage !== false) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-admin-card border border-admin-warn-fg/25 bg-admin-warn-bg px-4 py-3 text-sm text-admin-warn-fg"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <strong className="font-semibold">Mode démo — upload désactivé.</strong>{" "}
        Cet hébergement ne conserve pas les fichiers sans Supabase Storage. Configurez{" "}
        <code className="rounded bg-admin-surface/50 px-1 text-xs">SUPABASE_URL</code> +{" "}
        <code className="rounded bg-admin-surface/50 px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        sur Vercel pour activer les uploads, ou utilisez le VPS / localhost.
      </div>
    </div>
  );
}
