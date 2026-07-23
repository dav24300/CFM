"use client";

import { useState } from "react";
import { PROVINCES_RDC } from "@/lib/constants";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { FormSelect } from "@/components/ui/patterns/form-select";
import { FormSuccessPanel } from "@/components/ux/FormSuccessPanel";
import { MemberAccountPromo } from "@/components/ux/MemberAccountPromo";
import { useAsyncAction } from "@/lib/hooks/use-async-action";
import { useTranslations } from "@/lib/i18n-client";

const TYPE_IDS = ["famille", "soutien", "benevole"] as const;

export function MembershipForm() {
  const { t } = useTranslations();
  const fs = t.ux.formSuccess;
  const f = t.forms;
  const [type, setType] = useState("famille");
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    province: "",
    military_link: "",
    parent_military_name: "",
    skills: "",
    message: "",
  });

  const isFamille = type === "famille";
  const isBenevole = type === "benevole";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/membership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ...form }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        try {
          // Pont vers /membre/inscription : évite la re-saisie (sessionStorage,
          // jamais l'URL — données personnelles).
          sessionStorage.setItem("cfm-adhesion-prefill", JSON.stringify({ type, ...form }));
        } catch {
          // stockage indisponible : le préremplissage est simplement perdu
        }
        setForm({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          province: "",
          military_link: "",
          parent_military_name: "",
          skills: "",
          message: "",
        });
      });
    } catch {
      // handled by hook
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label={f.membershipType} htmlFor="membership-type" required>
        <NativeSelect
          id="membership-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        >
          {TYPE_IDS.map((id) => (
            <option key={id} value={id}>
              {t.membershipTypes[id].label}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={f.firstName} htmlFor="first_name" required>
          <Input
            type="text"
            required
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
          />
        </FormField>
        <FormField label={f.lastName} htmlFor="last_name" required>
          <Input
            type="text"
            required
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={f.email} htmlFor="email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </FormField>
        <FormField label={f.phone} htmlFor="phone" required>
          <Input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label={f.province} htmlFor="province">
        <FormSelect
          id="province"
          value={form.province}
          onValueChange={(v) => update("province", v)}
          placeholder={t.common.select}
          options={PROVINCES_RDC.map((p) => ({ value: p, label: p }))}
        />
      </FormField>

      {isFamille && (
        <>
          <FormField label={f.militaryLink} htmlFor="military_link" required>
            <NativeSelect
              id="military_link"
              required
              value={form.military_link}
              onChange={(e) => update("military_link", e.target.value)}
            >
              <option value="">{t.common.select}</option>
              <option value="conjoint">{f.links.conjoint}</option>
              <option value="enfant">{f.links.enfant}</option>
              <option value="veuve">{f.links.veuve}</option>
              <option value="orphelin">{f.links.orphelin}</option>
              <option value="parent">{f.links.parent}</option>
            </NativeSelect>
          </FormField>
          <FormField label={f.militaryName} htmlFor="parent_military_name">
            <Input
              type="text"
              value={form.parent_military_name}
              onChange={(e) => update("parent_military_name", e.target.value)}
            />
          </FormField>
        </>
      )}

      {isBenevole && (
        <FormField label={f.skillsAvailability} htmlFor="skills">
          <Textarea
            rows={3}
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder={f.skillsPlaceholder}
          />
        </FormField>
      )}

      <FormField label={f.message} htmlFor="message">
        <Textarea rows={3} value={form.message} onChange={(e) => update("message", e.target.value)} />
      </FormField>

      <Button type="submit" loading={isLoading} className="w-full" data-cta="cta_adhesion">
        {f.submitRequest}
      </Button>

      {isSuccess && (
        <>
          <FormSuccessPanel
            acknowledgment={fs.membershipAck}
            delay={fs.membershipDelay}
            nextLabel={fs.membershipNext}
            nextHref="/membre/inscription"
          />
          <MemberAccountPromo labels={t.ux.memberPromo} />
        </>
      )}
      {isError && error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
