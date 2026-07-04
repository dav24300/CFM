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
      uploadés. Utilisez l&apos;admin sur le VPS production pour gérer les médias de façon durable.
    </div>
  );
}
