"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { DesignHeroPreview } from "@/components/admin/design/DesignHeroPreview";
import { MediaSlot } from "@/components/admin/design/MediaSlot";

export type HeroState = {
  hero_image: string;
  hero_image_mobile: string;
  hero_poster: string;
  hero_video: string;
  hero_image_alt: string;
  mission_image: string;
  mission_image_alt: string;
};

type FieldDef = {
  key: keyof HeroState;
  label: string;
  accept?: string;
  isVideo?: boolean;
};

const FIELDS: FieldDef[] = [
  { key: "hero_image", label: "Image hero desktop" },
  { key: "hero_image_mobile", label: "Image hero mobile" },
  { key: "hero_poster", label: "Poster vidéo" },
  { key: "hero_video", label: "Vidéo hero", accept: "video/mp4,video/webm", isVideo: true },
  { key: "mission_image", label: "Image section mission" },
];

type Props = {
  hero: HeroState;
  onChange: (hero: HeroState) => void;
  onSaved: () => void;
};

export function HeroSection({ hero, onChange, onSaved }: Props) {
  const { success, error } = useAdminToast();

  async function saveMeta() {
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hero }),
    });
    if (!res.ok) {
      error("Échec enregistrement");
      return;
    }
    success("Textes alt publiés sur le site");
    onSaved();
  }

  async function resetHero() {
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_hero" }),
    });
    if (!res.ok) {
      error("Échec reset");
      return;
    }
    success("Hero restauré aux valeurs par défaut");
    onSaved();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={saveMeta}>
            Publier textes alt
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetHero}>
            <RotateCcw className="mr-1 h-4 w-4" /> Restaurer défauts
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, accept, isVideo }) => (
            <MediaSlot
              key={key}
              label={label}
              value={hero[key]}
              kind={isVideo ? "video" : "image"}
              accept={accept || "image/jpeg,image/png,image/webp,image/svg+xml,image/heic,image/heif"}
              uploadOptions={{ settingKey: key, category: "hero" }}
              onUploaded={(path) => {
                onChange({ ...hero, [key]: path });
                onSaved();
              }}
              siteHref="/"
            />
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-admin-muted">Alt hero</label>
            <Input
              value={hero.hero_image_alt}
              onChange={(e) => onChange({ ...hero, hero_image_alt: e.target.value })}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-admin-muted">Alt mission</label>
            <Input
              value={hero.mission_image_alt}
              onChange={(e) => onChange({ ...hero, mission_image_alt: e.target.value })}
              className="mt-1 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <DesignHeroPreview
          image={hero.hero_image}
          video={hero.hero_video || undefined}
          poster={hero.hero_poster || hero.hero_image}
          alt={hero.hero_image_alt}
        />
      </div>
    </div>
  );
}
