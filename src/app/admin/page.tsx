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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-admin-surface p-8 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-deep text-admin-accent">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-admin-ink">{SITE.sigle} Admin</h1>
            <p className="text-sm text-admin-muted">Tableau de bord bénévole</p>
          </div>
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
      </div>
    </div>
  );
}
