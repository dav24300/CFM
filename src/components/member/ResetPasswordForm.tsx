"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

type Props = {
  token: string;
  labels: {
    password: string;
    confirm: string;
    submit: string;
    loading: string;
    success: string;
    login: string;
    mismatch: string;
  };
};

export function ResetPasswordForm({ token, labels }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirm) {
      setLocalError(labels.mismatch);
      return;
    }
    try {
      await run(async () => {
        const res = await fetch("/api/member/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccessMessage(labels.success);
        setTimeout(() => router.push("/membre/connexion"), 2000);
      });
    } catch {
      // handled by hook
    }
  }

  if (!token) {
    return (
      <Alert variant="error">
        Lien invalide.{" "}
        <Link href="/membre/mot-de-passe-oublie" className="text-site-primary hover:underline">
          Demander un nouveau lien
        </Link>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label={labels.password} htmlFor="reset_password" required>
        <Input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>

      <FormField label={labels.confirm} htmlFor="reset_confirm" required>
        <Input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </FormField>

      <Button type="submit" loading={isLoading} className="w-full">
        {labels.submit}
      </Button>

      {localError && <Alert variant="error">{localError}</Alert>}
      {isSuccess && successMessage && <Alert variant="success">{successMessage}</Alert>}
      {isError && error && <Alert variant="error">{error}</Alert>}

      {isSuccess && (
        <p className="text-center text-sm">
          <Link href="/membre/connexion" className="text-site-primary hover:underline">
            {labels.login}
          </Link>
        </p>
      )}
    </form>
  );
}
