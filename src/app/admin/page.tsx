import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getAdminAccess } from "@/lib/admin-access";
import { SITE } from "@/lib/constants";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const access = await getAdminAccess();
  if (access) redirect("/admin/dashboard");

  const { error } = await searchParams;
  const showError = error === "1";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Glow d'accent discret en fond */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgb(var(--admin-accent)/0.12),transparent_70%)]"
      />
      <div className="relative w-full max-w-md rounded-admin-card border border-admin-border bg-admin-surface p-8 shadow-admin-overlay">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-admin-card bg-admin-accent text-admin-accent-fg shadow-admin-rest">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-admin-h1 font-bold text-admin-ink">{SITE.sigle} Admin</h1>
          <p className="mt-1 text-sm text-admin-muted">Console de gestion — accès réservé</p>
        </div>

        {/* Formulaire HTML natif : fonctionne même si les chunks Next.js (_next/static) ne chargent pas */}
        <form action="/api/admin/login" method="post" className="mt-8 space-y-4">
          <FormField label="Mot de passe" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </FormField>

          {showError && (
            <Alert variant="error">Mot de passe incorrect</Alert>
          )}

          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-[11.5px] text-admin-muted-2">
          Espace sécurisé · {SITE.name}
        </p>
      </div>
    </div>
  );
}
