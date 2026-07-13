"use client";

import { Button } from "@/components/ui/primitives/button";

// Frontière d'erreur de la console admin (rendue dans le layout admin,
// theme-admin + dark). Re-lance les signaux de contrôle de flux Next.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const digest = error.digest ?? "";
  if (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")
  ) {
    throw error;
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-admin-danger-fg">
        Erreur
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold text-admin-ink">
        Une erreur est survenue
      </h1>
      <p className="mt-3 max-w-md text-sm text-admin-muted">
        Un problème inattendu s’est produit dans la console. Réessayez ou rechargez la page.
      </p>
      <div className="mt-7">
        <Button onClick={() => reset()}>Réessayer</Button>
      </div>
    </div>
  );
}
