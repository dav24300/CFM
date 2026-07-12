"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";

// Frontière d'erreur applicative (rendue dans le layout racine, theme-site).
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Ne jamais avaler les signaux de contrôle de flux Next (notFound/redirect) :
  // les re-lancer laisse le framework rendre le 404 / exécuter la redirection.
  const digest = error.digest ?? "";
  if (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")
  ) {
    throw error;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-24 text-center">
      <span className="mb-6 flex h-12 w-12 items-center justify-center bg-site-danger text-white">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-site-danger">
        Erreur
      </p>
      <h1 className="mt-3 font-serif text-h3 font-medium leading-tight text-site-ink">
        Une erreur est survenue
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-site-muted">
        Un problème inattendu s’est produit. Vous pouvez réessayer ; si le problème
        persiste, contactez-nous.
      </p>
      <div className="mt-8">
        <Button onClick={() => reset()}>Réessayer</Button>
      </div>
    </main>
  );
}
