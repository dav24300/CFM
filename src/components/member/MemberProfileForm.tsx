"use client";

import { useState } from "react";
import { PROVINCES_RDC } from "@/lib/constants";
import type { PublicUser } from "@/domain/entities/v2";
import { useTranslations } from "@/lib/i18n-client";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { FormSelect } from "@/components/ui/patterns/form-select";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

type Props = { user: PublicUser };

export function MemberProfileForm({ user }: Props) {
  const { t } = useTranslations();
  const f = t.forms;
  const m = t.pages.memberArea;
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone || "",
    province: user.province || "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/member/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccessMessage(t.common.profileUpdated);
      });
    } catch {
      // handled by hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={f.firstName} htmlFor="profile_first_name" required>
          <Input
            required
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        </FormField>
        <FormField label={f.lastName} htmlFor="profile_last_name" required>
          <Input
            required
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label={f.phone} htmlFor="profile_phone">
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </FormField>

      <FormField label={f.province} htmlFor="profile_province">
        <FormSelect
          id="profile_province"
          value={form.province}
          onValueChange={(v) => setForm({ ...form, province: v })}
          placeholder="—"
          options={PROVINCES_RDC.map((p) => ({ value: p, label: p }))}
        />
      </FormField>

      <p className="text-sm text-site-muted">
        {m.email} : {user.email}
      </p>

      <Button type="submit" loading={isLoading}>
        {t.common.save}
      </Button>

      {isSuccess && successMessage && <Alert variant="success">{successMessage}</Alert>}
      {isError && error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
