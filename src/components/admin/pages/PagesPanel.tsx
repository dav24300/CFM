"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/card";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";
import type { ContentBlocks } from "@/domain/site-config";

type LocaleTab = "fr" | "en";

const DEFAULT_BLOCKS: ContentBlocks = {
  about_timeline: {
    fr: [
      { date: "2018", title: "Fondation de CFM", description: "Création de l'ASBL." },
      { date: "2020", title: "Premières actions terrain", description: "Programmes d'accompagnement." },
    ],
    en: [
      { date: "2018", title: "CFM founded", description: "The NGO was created." },
      { date: "2020", title: "First field actions", description: "Support programmes launched." },
    ],
  },
  legal_privacy: {
    fr: "## Responsable du traitement\n\nCFM ASBL est responsable du traitement des données collectées via ce site.",
    en: "## Data controller\n\nCFM ASBL is responsible for data collected through this website.",
  },
  legal_mentions: {
    fr: "## Éditeur\n\nCFM ASBL — Association sans but lucratif.",
    en: "## Publisher\n\nCFM ASBL — Non-profit organization.",
  },
};

export function PagesPanel() {
  const [locale, setLocale] = useState<LocaleTab>("fr");
  const [blocks, setBlocks] = useState<ContentBlocks>(DEFAULT_BLOCKS);
  const [timelineJson, setTimelineJson] = useState("");
  const [privacyMd, setPrivacyMd] = useState("");
  const [mentionsMd, setMentionsMd] = useState("");
  const [loading, setLoading] = useState(true);
  const { success, error } = useAdminToast();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        let parsed: ContentBlocks = DEFAULT_BLOCKS;
        if (data.settings?.content_blocks) {
          try {
            parsed = { ...DEFAULT_BLOCKS, ...JSON.parse(data.settings.content_blocks) };
          } catch {
            parsed = DEFAULT_BLOCKS;
          }
        }
        setBlocks(parsed);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const items = blocks.about_timeline?.[locale] || [];
    setTimelineJson(JSON.stringify(items, null, 2));
    setPrivacyMd(blocks.legal_privacy?.[locale] || "");
    setMentionsMd(blocks.legal_mentions?.[locale] || "");
  }, [blocks, locale]);

  async function save() {
    let timeline;
    try {
      timeline = JSON.parse(timelineJson);
      if (!Array.isArray(timeline)) throw new Error("invalid");
    } catch {
      error("Timeline : JSON invalide");
      return;
    }

    const next: ContentBlocks = {
      ...blocks,
      about_timeline: {
        ...blocks.about_timeline,
        [locale]: timeline,
      },
      legal_privacy: {
        ...blocks.legal_privacy,
        [locale]: privacyMd,
      },
      legal_mentions: {
        ...blocks.legal_mentions,
        [locale]: mentionsMd,
      },
    };

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { content_blocks: JSON.stringify(next) } }),
    });
    if (!res.ok) {
      error("Échec enregistrement");
      return;
    }
    setBlocks(next);
    success("Pages structurelles mises à jour");
  }

  if (loading) {
    return <p className="text-sm text-admin-muted">Chargement…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Pages structurelles"
        subtitle="Timeline « À propos », confidentialité et mentions légales du site."
        actions={
          <>
            <PreviewButton href="/a-propos" tags={[CACHE_TAGS.siteConfig]} label="À propos" />
            <PreviewButton href="/confidentialite" tags={[CACHE_TAGS.siteConfig]} label="Confidentialité" />
          </>
        }
      />

      <div className="space-y-6">
        <Tabs value={locale} onValueChange={(v) => setLocale(v as LocaleTab)}>
          <TabsList>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="space-y-3 p-5">
          <CardHeader
            title="Timeline À propos (JSON)"
            subtitle={"Tableau d'objets : date, title, description, image (optionnel)"}
          />
          <Textarea rows={10} value={timelineJson} onChange={(e) => setTimelineJson(e.target.value)} className="font-mono text-xs" />
        </Card>

        <Card className="space-y-3 p-5">
          <CardHeader title="Confidentialité (markdown)" />
          <Textarea rows={12} value={privacyMd} onChange={(e) => setPrivacyMd(e.target.value)} className="font-mono text-xs" />
        </Card>

        <Card className="space-y-3 p-5">
          <CardHeader title="Mentions légales (markdown)" />
          <Textarea rows={12} value={mentionsMd} onChange={(e) => setMentionsMd(e.target.value)} className="font-mono text-xs" />
        </Card>

        <Button type="button" size="sm" onClick={save}>Enregistrer</Button>
      </div>
    </div>
  );
}
