"use client";

import { useEffect, useState } from "react";

export function ServerlessUploadBanner() {
  const [readonly, setReadonly] = useState(false);

  useEffect(() => {
    fetch("/api/admin/media/upload-capabilities")
      .then((r) => r.json())
      .then((d) => setReadonly(d.storageAvailable === false))
      .catch(() => {});
  }, []);

  if (!readonly) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <strong>Mode démo — upload désactivé.</strong> Cet hébergement ne conserve pas les fichiers
      sans Supabase Storage. Configurez{" "}
      <code className="text-xs">SUPABASE_URL</code> +{" "}
      <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> sur Vercel pour activer les
      uploads, ou utilisez le VPS / localhost.
    </div>
  );
}
