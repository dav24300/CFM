"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";

export function I18nPanel() {
  const [locales, setLocales] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});
  const [locale, setLocale] = useState("fr");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const { success, error } = useAdminToast();

  async function load() {
    const [i18nRes, settingsRes] = await Promise.all([
      fetch("/api/admin/i18n"),
      fetch("/api/admin/settings"),
    ]);
    if (i18nRes.ok) {
      const data = await i18nRes.json();
      setLocales((data.locales || []).filter((l: string) => l === "fr" || l === "en"));
      setOverrides(data.overrides || {});
    }
    if (settingsRes.ok) {
      const data = await settingsRes.json();
      setSocialLinks(data.settings?.social_links || "");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveOverride(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/i18n", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, key, value }),
    });
    if (!res.ok) {
      error("Échec enregistrement");
      return;
    }
    success("Texte mis à jour");
    load();
  }

  async function saveSocial(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { social_links: socialLinks } }),
    });
    if (!res.ok) {
      error("Échec constantes");
      return;
    }
    success("Constantes mises à jour");
  }

  const localeOverrides = overrides[locale] || {};

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl font-bold text-admin-ink">Langues & textes</h2>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold">Override i18n</h3>
        <p className="mt-1 text-sm text-gray-600">
          Clés au format pointé (ex. <code>home.hero.title</code>). Les overrides sont stockés en base.
        </p>
        <form onSubmit={saveOverride} className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            {locales.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Clé (ex. nav.about)" required />
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Nouvelle valeur" className="md:col-span-2" required rows={2} />
          <Button type="submit" size="sm" className="w-fit">Enregistrer override</Button>
        </form>
        {Object.keys(localeOverrides).length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-gray-600">
            {Object.entries(localeOverrides).map(([k, v]) => (
              <li key={k}><strong>{k}</strong>: {v}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold">Constantes site — liens sociaux (JSON)</h3>
        <form onSubmit={saveSocial} className="mt-3 space-y-2">
          <Textarea value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} rows={4} className="font-mono text-xs" />
          <Button type="submit" size="sm">Enregistrer</Button>
        </form>
      </section>
    </div>
  );
}
