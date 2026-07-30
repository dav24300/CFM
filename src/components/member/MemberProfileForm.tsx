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
    email: user.email || "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();

  // Second formulaire indépendant : changement de mot de passe.
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const pwdAction = useAsyncAction();

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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess("");
    if (pwd.new_password !== pwd.confirm) {
      setPwdError(t.common.passwordMismatch);
      return;
    }
    try {
      await pwdAction.run(async () => {
        const res = await fetch("/api/member/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: pwd.current_password,
            new_password: pwd.new_password,
          }),
        });
        const data = await res.json().catch(() => ({}) as { error?: string });
        if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
        setPwd({ current_password: "", new_password: "", confirm: "" });
        setPwdSuccess(m.passwordChanged);
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

      {/* Email ÉDITABLE : facultatif, mais seule voie de récupération autonome
          pour un membre inscrit sans email. */}
      <FormField label={m.emailOptional} htmlFor="profile_email">
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </FormField>
      {!user.email && <Alert variant="info">{m.emailAddNotice}</Alert>}

      <Button type="submit" loading={isLoading}>
        {t.common.save}
      </Button>

      {isSuccess && successMessage && <Alert variant="success">{successMessage}</Alert>}
      {isError && error && <Alert variant="error">{error}</Alert>}

      <div className="mt-6 space-y-4 border-t border-site-line pt-6">
        <h3 className="font-semibold text-site-ink">{m.changePassword}</h3>
        <FormField label={m.currentPassword} htmlFor="profile_current_password" required>
          <Input
            type="password"
            autoComplete="current-password"
            value={pwd.current_password}
            onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={`${m.newPassword} (min. 8)`} htmlFor="profile_new_password" required>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={pwd.new_password}
              onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
            />
          </FormField>
          <FormField label={m.confirmPassword} htmlFor="profile_confirm_password" required>
            <Input
              type="password"
              autoComplete="new-password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </FormField>
        </div>
        <Button type="button" onClick={handlePasswordSubmit} loading={pwdAction.isLoading}>
          {m.changePassword}
        </Button>
        {pwdSuccess && <Alert variant="success">{pwdSuccess}</Alert>}
        {(pwdError || (pwdAction.isError && pwdAction.error)) && (
          <Alert variant="error">{pwdError || pwdAction.error}</Alert>
        )}
      </div>
    </form>
  );
}
