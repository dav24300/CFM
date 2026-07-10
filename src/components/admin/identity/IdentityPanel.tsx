"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

type FormState = {
  site_name: string;
  site_sigle: string;
  site_tagline: string;
  site_quote: string;
  site_founder: string;
  site_founded: string;
  site_country: string;
  site_email: string;
  site_phone: string;
};

const EMPTY: FormState = {
  site_name: "",
  site_sigle: "",
  site_tagline: "",
  site_quote: "",
  site_founder: "",
  site_founded: "",
  site_country: "",
  site_email: "",
  site_phone: "",
};

export function IdentityPanel() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const { success, error } = useAdminToast();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings || {};
        setForm({
          site_name: s.site_name || "",
          site_sigle: s.site_sigle || "",
          site_tagline: s.site_tagline || "",
          site_quote: s.site_quote || "",
          site_founder: s.site_founder || "",
          site_founded: s.site_founded || "",
          site_country: s.site_country || "",
          site_email: s.site_email || "",
          site_phone: s.site_phone || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: form }),
    });
    if (!res.ok) {
      error("Échec enregistrement");
      return;
    }
    success("Identité mise à jour");
  }

  if (loading) {
    return <p className="text-sm text-admin-muted">Chargement…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-admin-ink">Identité & contact</h2>
        <PreviewButton href="/contact" tags={[CACHE_TAGS.siteConfig]} />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-2">
        <Input placeholder="Nom complet" value={form.site_name} onChange={(e) => setField("site_name", e.target.value)} />
        <Input placeholder="Sigle (CFM)" value={form.site_sigle} onChange={(e) => setField("site_sigle", e.target.value)} />
        <Input placeholder="Tagline" className="md:col-span-2" value={form.site_tagline} onChange={(e) => setField("site_tagline", e.target.value)} />
        <Textarea placeholder="Citation" className="md:col-span-2" rows={2} value={form.site_quote} onChange={(e) => setField("site_quote", e.target.value)} />
        <Input placeholder="Fondateur" value={form.site_founder} onChange={(e) => setField("site_founder", e.target.value)} />
        <Input placeholder="Année fondation" type="number" value={form.site_founded} onChange={(e) => setField("site_founded", e.target.value)} />
        <Input placeholder="Pays" className="md:col-span-2" value={form.site_country} onChange={(e) => setField("site_country", e.target.value)} />
        <Input placeholder="Email" type="email" value={form.site_email} onChange={(e) => setField("site_email", e.target.value)} />
        <Input placeholder="Téléphone" value={form.site_phone} onChange={(e) => setField("site_phone", e.target.value)} />
        <div className="md:col-span-2">
          <Button type="submit" size="sm">Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
