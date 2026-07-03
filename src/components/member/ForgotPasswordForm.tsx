"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

type Props = {
  labels: { email: string; submit: string; loading: string; back: string; success: string };
};

export function ForgotPasswordForm({ labels }: Props) {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/member/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccessMessage(data.message || labels.success);
      });
    } catch {
      // handled by hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label={labels.email} htmlFor="forgot_email" required>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>

      <Button type="submit" loading={isLoading} className="w-full">
        {labels.submit}
      </Button>

      {isSuccess && successMessage && <Alert variant="success">{successMessage}</Alert>}
      {isError && error && <Alert variant="error">{error}</Alert>}

      <p className="text-center text-sm text-cfm-earth">
        <Link href="/membre/connexion" className="text-cfm-gold hover:underline">
          {labels.back}
        </Link>
      </p>
    </form>
  );
}
