"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { SITE } from "@/lib/constants";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { isLoading, isError, error, run } = useAsyncAction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur");
        }
        router.push("/admin/dashboard");
        router.refresh();
      });
    } catch {
      // handled by hook
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cfm-navy text-cfm-gold">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-cfm-navy">{SITE.sigle} Admin</h1>
            <p className="text-sm text-gray-500">Tableau de bord bénévole</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <FormField label="Mot de passe" htmlFor="password" required>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>

          {isError && error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" loading={isLoading} className="w-full">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
