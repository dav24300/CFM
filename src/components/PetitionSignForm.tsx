"use client";

import { useState } from "react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { FormSuccessPanel } from "@/components/ux/FormSuccessPanel";
import { MemberAccountPromo } from "@/components/ux/MemberAccountPromo";
import { useAsyncAction } from "@/lib/hooks/use-async-action";
import { useTranslations } from "@/lib/i18n-client";

type Labels = {
  signTitle: string;
  name: string;
  email: string;
  submit: string;
  success: string;
};

type Props = {
  slug: string;
  petitionTitle: string;
  labels: Labels;
};

export function PetitionSignForm({ slug, petitionTitle, labels }: Props) {
  const { t } = useTranslations();
  const fs = t.ux.formSuccess;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch(`/api/petitions/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setName("");
        setEmail("");
      });
    } catch {
      // handled by hook
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        <h3 className="font-display text-lg font-bold">
          {labels.signTitle} : {petitionTitle}
        </h3>

        <FormField label={labels.name} htmlFor="petition_name" required>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label={labels.email} htmlFor="petition_email" required>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>

        <Button type="submit" loading={isLoading} className="w-full" data-cta="cta_petition">
          {labels.submit}
        </Button>

        {isError && error && <Alert variant="error">{error}</Alert>}
      </form>

      {isSuccess && (
        <>
          <FormSuccessPanel
            acknowledgment={fs.petitionAck}
            delay={fs.petitionDelay}
            nextLabel={fs.petitionNext}
            nextHref="/membre/inscription"
          />
          <MemberAccountPromo labels={t.ux.memberPromo} />
        </>
      )}
    </>
  );
}
