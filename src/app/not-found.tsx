import { Shield } from "lucide-react";
import { ButtonLink } from "@/components/ui/patterns/button-link";

// 404 globale (URL non appariée hors groupe (site)/admin). Rendu dans le
// layout racine (body theme-site) → autonome, sans chrome (site).
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-24 text-center">
      <span className="mb-6 flex h-12 w-12 items-center justify-center bg-site-primary text-white">
        <Shield className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-site-primary">
        Erreur 404
      </p>
      <h1 className="mt-3 font-serif text-h1 font-medium leading-tight text-site-ink">
        Page introuvable
      </h1>
      <p className="mt-4 max-w-md text-[16px] leading-relaxed text-site-muted">
        La page que vous cherchez n’existe pas ou a été déplacée.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Retour à l’accueil</ButtonLink>
      </div>
    </main>
  );
}
