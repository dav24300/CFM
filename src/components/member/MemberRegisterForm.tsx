"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROVINCES_RDC } from "@/lib/constants";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { FormSelect } from "@/components/ui/patterns/form-select";
import { useAsyncAction } from "@/lib/hooks/use-async-action";
import { useTranslations } from "@/lib/i18n-client";

const TYPE_IDS = ["famille", "soutien", "benevole"] as const;

const PREFILL_KEY = "cfm-adhesion-prefill";
const PREFILL_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "province",
  "military_link",
  "parent_military_name",
  "skills",
] as const;

export function MemberRegisterForm() {
  const { t } = useTranslations();
  const m = t.pages.memberArea;
  const f = t.forms;
  const router = useRouter();
  const [type, setType] = useState("famille");
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    first_name: "",
    last_name: "",
    phone: "",
    province: "",
    military_link: "",
    parent_military_name: "",
    skills: "",
  });

  const isFamille = type === "famille";
  const isBenevole = type === "benevole";
  const [prefilled, setPrefilled] = useState(false);

  // Reprend la demande d'adhésion rapide (/s-engager) : mêmes champs,
  // il ne reste qu'à choisir un mot de passe.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREFILL_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, unknown>;
      if (TYPE_IDS.includes(saved.type as (typeof TYPE_IDS)[number])) {
        setType(saved.type as string);
      }
      setForm((prev) => {
        const next = { ...prev };
        for (const field of PREFILL_FIELDS) {
          const value = saved[field];
          if (typeof value === "string" && value) next[field] = value;
        }
        return next;
      });
      setPrefilled(true);
    } catch {
      // préremplissage facultatif
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (form.password !== form.confirm) {
      setLocalError(t.common.passwordMismatch);
      return;
    }
    try {
      await run(async () => {
        const res = await fetch("/api/member/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            membership_type: type,
            email: form.email,
            password: form.password,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            province: form.province,
            military_link: isFamille ? form.military_link : undefined,
            parent_military_name: isFamille ? form.parent_military_name : undefined,
            skills: isBenevole ? form.skills : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        try {
          sessionStorage.removeItem(PREFILL_KEY);
        } catch {
          // stockage indisponible
        }
        setSuccessMessage(m.registerSuccess);
        setTimeout(() => router.push("/membre/connexion"), 2500);
      });
    } catch {
      // handled by hook
    }
  }

  function u(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {prefilled && <Alert variant="info">{m.prefillNotice}</Alert>}

      <FormField label={f.accountType} htmlFor="register_type" required>
        <NativeSelect
          id="register_type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPE_IDS.map((id) => (
            <option key={id} value={id}>
              {t.membershipTypes[id].label}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={f.firstName} htmlFor="register_first_name" required>
          <Input required value={form.first_name} onChange={(e) => u("first_name", e.target.value)} />
        </FormField>
        <FormField label={f.lastName} htmlFor="register_last_name" required>
          <Input required value={form.last_name} onChange={(e) => u("last_name", e.target.value)} />
        </FormField>
      </div>

      <FormField label={m.email} htmlFor="register_email" required>
        <Input type="email" required value={form.email} onChange={(e) => u("email", e.target.value)} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={`${m.password} (min. 8)`} htmlFor="register_password" required>
          <Input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => u("password", e.target.value)}
          />
        </FormField>
        <FormField label={m.confirmPassword} htmlFor="register_confirm" required>
          <Input
            type="password"
            required
            value={form.confirm}
            onChange={(e) => u("confirm", e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={f.phone} htmlFor="register_phone" required>
          <Input type="tel" required value={form.phone} onChange={(e) => u("phone", e.target.value)} />
        </FormField>
        <FormField label={f.province} htmlFor="register_province">
          <FormSelect
            id="register_province"
            value={form.province}
            onValueChange={(v) => u("province", v)}
            placeholder={t.common.select}
            options={PROVINCES_RDC.map((p) => ({ value: p, label: p }))}
          />
        </FormField>
      </div>

      {isFamille && (
        <>
          <FormField label={f.militaryLink} htmlFor="register_military_link" required>
            <NativeSelect
              id="register_military_link"
              required
              value={form.military_link}
              onChange={(e) => u("military_link", e.target.value)}
            >
              <option value="">{t.common.select}</option>
              <option value="conjoint">{f.links.conjoint}</option>
              <option value="enfant">{f.links.enfant}</option>
              <option value="veuve">{f.links.veuve}</option>
              <option value="orphelin">{f.links.orphelin}</option>
              <option value="parent">{f.links.parent}</option>
            </NativeSelect>
          </FormField>
          <FormField label={f.militaryName} htmlFor="register_military_name">
            <Input
              value={form.parent_military_name}
              onChange={(e) => u("parent_military_name", e.target.value)}
            />
          </FormField>
        </>
      )}

      {isBenevole && (
        <FormField label={f.skills} htmlFor="register_skills">
          <Textarea rows={3} value={form.skills} onChange={(e) => u("skills", e.target.value)} />
        </FormField>
      )}

      <Button type="submit" loading={isLoading} className="w-full">
        {m.registerBtn}
      </Button>

      {localError && <Alert variant="error">{localError}</Alert>}
      {isSuccess && successMessage && <Alert variant="success">{successMessage}</Alert>}
      {isError && error && <Alert variant="error">{error}</Alert>}

      <p className="text-center text-sm text-site-muted">
        {m.hasAccount}{" "}
        <Link href="/membre/connexion" className="text-site-primary hover:underline">
          {m.loginLink}
        </Link>
      </p>
    </form>
  );
}
