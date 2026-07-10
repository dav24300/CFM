"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { SkeletonList } from "@/components/ui/primitives/skeleton";
import { HeroSection, type HeroState } from "@/components/admin/design/HeroSection";
import { MediaLibrarySection } from "@/components/admin/design/MediaLibrarySection";
import { CollectionsSection } from "@/components/admin/design/CollectionsSection";
import { DefaultsSection, type DefaultsState } from "@/components/admin/design/DefaultsSection";
import { PressSection } from "@/components/admin/design/PressSection";
import { MissingMediaSection } from "@/components/admin/design/MissingMediaSection";
import { ServerlessUploadBanner } from "@/components/admin/design/ServerlessUploadBanner";

type Tab = "hero" | "library" | "collections" | "defaults" | "press" | "missing";

const EMPTY_HERO: HeroState = {
  hero_image: "",
  hero_image_mobile: "",
  hero_poster: "",
  hero_video: "",
  hero_image_alt: "",
  mission_image: "",
  mission_image_alt: "",
};

const EMPTY_DEFAULTS: DefaultsState = {
  default_news_cover: "",
  default_live_thumb: "",
  default_testimonial_1: "",
  default_testimonial_2: "",
  default_testimonial_anonymous: "",
  about_founder: "",
  about_team: "",
  og_image: "",
  favicon_url: "",
};

export function DesignPanel() {
  const [tab, setTab] = useState<Tab>("hero");
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState<HeroState>(EMPTY_HERO);
  const [defaults, setDefaults] = useState<DefaultsState>(EMPTY_DEFAULTS);
  const [pressKit, setPressKit] = useState("");
  const [missingCount, setMissingCount] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const [mediaRes, missingRes] = await Promise.all([
        fetch("/api/admin/media"),
        fetch("/api/admin/media/missing"),
      ]);
      if (mediaRes.ok) {
        const data = await mediaRes.json();
        setHero({ ...EMPTY_HERO, ...data.hero });
        setDefaults({ ...EMPTY_DEFAULTS, ...data.defaults });
        setPressKit(data.defaults?.press_kit_url || "");
      }
      if (missingRes.ok) {
        const m = await missingRes.json();
        setMissingCount(m.count || 0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <SkeletonList count={4} />;

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-admin-ink">Médias & design</h2>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1 text-sm text-admin-accent"
        >
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      <ServerlessUploadBanner />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="hero">Accueil & hero</TabsTrigger>
          <TabsTrigger value="library">Bibliothèque</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="defaults">Defaults & équipe</TabsTrigger>
          <TabsTrigger value="press">Presse</TabsTrigger>
          <TabsTrigger value="missing">
            Sans visuel{missingCount > 0 ? ` (${missingCount})` : ""}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "hero" && <HeroSection hero={hero} onChange={setHero} onSaved={load} />}
      {tab === "library" && <MediaLibrarySection />}
      {tab === "collections" && <CollectionsSection />}
      {tab === "defaults" && (
        <DefaultsSection defaults={defaults} onChange={setDefaults} onSaved={load} />
      )}
      {tab === "press" && <PressSection pressKitUrl={pressKit} onSaved={load} />}
      {tab === "missing" && <MissingMediaSection />}
    </div>
  );
}
