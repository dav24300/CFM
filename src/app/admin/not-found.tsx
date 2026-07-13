import { ButtonLink } from "@/components/ui/patterns/button-link";

// 404 de la console admin. Rendu dans le layout admin (theme-admin + dark) →
// teal/sombre, jamais le chrome bleu du site. ButtonLink hérite de l'accent teal.
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-admin-accent">
        Erreur 404
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-admin-ink">Page introuvable</h1>
      <p className="mt-3 max-w-md text-sm text-admin-muted">
        Cette page d’administration n’existe pas ou a été déplacée.
      </p>
      <div className="mt-7">
        <ButtonLink href="/admin/dashboard">Retour au tableau de bord</ButtonLink>
      </div>
    </div>
  );
}
