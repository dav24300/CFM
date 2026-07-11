"use client";

import { useState } from "react";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { FormSuccessPanel } from "@/components/ux/FormSuccessPanel";
import { useAsyncAction } from "@/lib/hooks/use-async-action";
import { useTranslations } from "@/lib/i18n-client";

type Props = {
  defaultType?: string;
};

export function ContactForm({ defaultType = "contact" }: Props) {
  const { t } = useTranslations();
  const fs = t.ux.formSuccess;
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: defaultType,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        setForm({ name: "", email: "", subject: "", message: "", type: defaultType });
      });
    } catch {
      // handled by hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nom complet" htmlFor="contact_name" required>
        <Input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </FormField>

      <FormField label="Email" htmlFor="contact_email" required>
        <Input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </FormField>

      <FormField label="Sujet" htmlFor="contact_subject">
        <Input
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </FormField>

      <FormField label="Message" htmlFor="contact_message" required>
        <Textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </FormField>

      <input type="hidden" name="type" value={form.type} />

      <Button type="submit" loading={isLoading} className="w-full">
        Envoyer
      </Button>

      {isSuccess && (
        <FormSuccessPanel
          acknowledgment={fs.contactAck}
          delay={fs.contactDelay}
          nextLabel={fs.contactNext}
          nextHref="/actions"
        />
      )}
      {isError && error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
