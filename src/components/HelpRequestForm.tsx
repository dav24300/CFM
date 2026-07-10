"use client";

import { useState } from "react";
import { PROVINCES_RDC } from "@/lib/constants";
import { Shield } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { FormSelect } from "@/components/ui/patterns/form-select";
import { FormSuccessPanel } from "@/components/ux/FormSuccessPanel";
import { useAsyncAction } from "@/lib/hooks/use-async-action";
import { useTranslations } from "@/lib/i18n-client";

export function HelpRequestForm() {
  const { t } = useTranslations();
  const fs = t.ux.formSuccess;
  const [localError, setLocalError] = useState<string | null>(null);
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    province: "",
    age: "",
    is_minor: false,
    parental_consent: false,
    military_status: "",
    need_type: "",
    description: "",
  });

  const showMinorFields = form.age !== "" && parseInt(form.age, 10) < 18;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (showMinorFields && !form.parental_consent) {
      setLocalError("Le consentement parental est requis pour les mineurs.");
      return;
    }
    if (!form.province) {
      setLocalError("Veuillez sélectionner une province.");
      return;
    }
    try {
      await run(async () => {
        const res = await fetch("/api/help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            age: form.age ? parseInt(form.age, 10) : null,
            is_minor: showMinorFields,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        setForm({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          province: "",
          age: "",
          is_minor: false,
          parental_consent: false,
          military_status: "",
          need_type: "",
          description: "",
        });
      });
    } catch {
      // handled by hook
    }
  }

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert variant="info" className="flex items-start gap-3">
        <Shield className="h-5 w-5 shrink-0 text-site-primary" aria-hidden />
        <p>
          Ce formulaire est <strong>strictement confidentiel</strong>. Vos données ne seront
          accessibles qu&apos;à l&apos;équipe autorisée de CFM et ne seront jamais publiées.
        </p>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Prénom" htmlFor="help_first_name" required>
          <Input
            type="text"
            required
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
          />
        </FormField>
        <FormField label="Nom" htmlFor="help_last_name" required>
          <Input
            type="text"
            required
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Téléphone" htmlFor="help_phone" required>
          <Input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </FormField>
        <FormField label="Email" htmlFor="help_email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Province" htmlFor="help_province" required>
          <FormSelect
            id="help_province"
            value={form.province}
            onValueChange={(v) => update("province", v)}
            placeholder="Sélectionner"
            options={PROVINCES_RDC.map((p) => ({ value: p, label: p }))}
          />
        </FormField>
        <FormField label="Âge" htmlFor="help_age">
          <Input
            type="number"
            min="1"
            max="120"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
          />
        </FormField>
      </div>

      {showMinorFields && (
        <Alert variant="warning">
          <p className="font-medium">Protection des mineurs</p>
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.parental_consent}
              onChange={(e) => update("parental_consent", e.target.checked)}
              className="mt-1"
              required
            />
            Je confirme disposer du consentement parental pour cette demande.
          </label>
        </Alert>
      )}

      <FormField label="Statut familial militaire" htmlFor="military_status">
        <NativeSelect
          id="military_status"
          value={form.military_status}
          onChange={(e) => update("military_status", e.target.value)}
        >
          <option value="">Sélectionner</option>
          <option value="conjoint">Conjoint(e) de militaire</option>
          <option value="veuve">Veuve / Veuf</option>
          <option value="orphelin">Orphelin</option>
          <option value="enfant">Enfant de militaire</option>
          <option value="parent">Parent de militaire</option>
        </NativeSelect>
      </FormField>

      <FormField label="Type de besoin" htmlFor="need_type" required>
        <NativeSelect
          id="need_type"
          required
          value={form.need_type}
          onChange={(e) => update("need_type", e.target.value)}
        >
          <option value="">Sélectionner</option>
          <option value="social">Aide sociale</option>
          <option value="economique">Aide économique / entrepreneuriat</option>
          <option value="education">Éducation / scolarisation</option>
          <option value="sante">Santé</option>
          <option value="juridique">Assistance juridique</option>
          <option value="autre">Autre</option>
        </NativeSelect>
      </FormField>

      <FormField label="Décrivez votre situation" htmlFor="description" required>
        <Textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Décrivez votre situation et le type d'aide recherchée..."
        />
      </FormField>

      <Button type="submit" loading={isLoading} className="w-full" data-cta="cta_aide">
        Envoyer ma demande confidentielle
      </Button>

      {localError && <Alert variant="error">{localError}</Alert>}
      {isSuccess && (
        <FormSuccessPanel
          acknowledgment={fs.helpAck}
          delay={fs.helpDelay}
          nextLabel={fs.helpNext}
          nextHref="/membre/inscription"
        />
      )}
      {isError && error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
