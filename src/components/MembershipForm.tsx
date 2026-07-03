"use client";

import { useState } from "react";
import { PROVINCES_RDC, MEMBERSHIP_TYPES } from "@/lib/constants";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { FormSelect } from "@/components/ui/patterns/form-select";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

export function MembershipForm() {
  const [type, setType] = useState("famille");
  const [successMessage, setSuccessMessage] = useState("");
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
        setSuccessMessage(
          "Votre demande d'adhésion a été enregistrée. Nous vous contacterons sous peu."
        );
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
      <FormField label="Type d'adhésion" htmlFor="membership-type" required>
        <NativeSelect
          id="membership-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        >
          {MEMBERSHIP_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Prénom" htmlFor="first_name" required>
          <Input
            type="text"
            required
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
          />
        </FormField>
        <FormField label="Nom" htmlFor="last_name" required>
          <Input
            type="text"
            required
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Email" htmlFor="email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </FormField>
        <FormField label="Téléphone" htmlFor="phone" required>
          <Input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Province" htmlFor="province">
        <FormSelect
          id="province"
          value={form.province}
          onValueChange={(v) => update("province", v)}
          placeholder="Sélectionner"
          options={PROVINCES_RDC.map((p) => ({ value: p, label: p }))}
        />
      </FormField>

      {isFamille && (
        <>
          <FormField label="Lien avec le militaire" htmlFor="military_link" required>
            <NativeSelect
              id="military_link"
              required
              value={form.military_link}
              onChange={(e) => update("military_link", e.target.value)}
            >
              <option value="">Sélectionner</option>
              <option value="conjoint">Conjoint(e)</option>
              <option value="enfant">Enfant</option>
              <option value="veuve">Veuve / Veuf</option>
              <option value="orphelin">Orphelin</option>
              <option value="parent">Parent</option>
            </NativeSelect>
          </FormField>
          <FormField label="Nom du militaire concerné" htmlFor="parent_military_name">
            <Input
              type="text"
              value={form.parent_military_name}
              onChange={(e) => update("parent_military_name", e.target.value)}
            />
          </FormField>
        </>
      )}

      {isBenevole && (
        <FormField label="Compétences & disponibilité" htmlFor="skills">
          <Textarea
            rows={3}
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder="Ex: communication, juridique, disponible les week-ends..."
          />
        </FormField>
      )}

      <FormField label="Message" htmlFor="message">
        <Textarea rows={3} value={form.message} onChange={(e) => update("message", e.target.value)} />
      </FormField>

      <Button type="submit" loading={isLoading} className="w-full">
        Soumettre ma demande
      </Button>

      {isSuccess && successMessage && <Alert variant="success">{successMessage}</Alert>}
      {isError && error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
