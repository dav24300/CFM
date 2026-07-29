"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { useAsyncAction } from "@/lib/hooks/use-async-action";
import { useTranslations } from "@/lib/i18n-client";

export function MemberLoginForm() {
  const { t } = useTranslations();
  const m = t.pages.memberArea;
  const router = useRouter();
  const { isLoading, isError, error, run } = useAsyncAction();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/member/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        router.push("/membre");
        router.refresh();
      });
    } catch {
      // handled by hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label={m.identifier} htmlFor="login_identifier" hint={m.identifierHint} required>
        {/* type="text" et non "email" : le navigateur refuse « 0812345678 »
            dans un champ email avant même toute requête. autoCapitalize/off
            évite qu'Android transforme « jean@x.cd » en « Jean@x.cd ». */}
        <Input
          type="text"
          inputMode="text"
          autoComplete="username"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </FormField>

      <FormField label={m.password} htmlFor="login_password" required>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>

      <Button type="submit" loading={isLoading} className="w-full">
        {m.loginBtn}
      </Button>

      {isError && error && <Alert variant="error">{error}</Alert>}

      <p className="text-right text-sm">
        <Link href="/membre/mot-de-passe-oublie" className="text-site-primary hover:underline">
          {m.forgotLink}
        </Link>
      </p>
      <p className="text-center text-sm text-site-muted">
        {m.noAccount}{" "}
        <Link href="/membre/inscription" className="text-site-primary hover:underline">
          {m.registerLink}
        </Link>
      </p>
    </form>
  );
}
