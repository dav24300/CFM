"use client";

import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { MediaSlot } from "@/components/admin/design/MediaSlot";

export type DefaultsState = {
  default_news_cover: string;
  default_live_thumb: string;
  default_testimonial_1: string;
  default_testimonial_2: string;
  default_testimonial_anonymous: string;
  about_founder: string;
  about_team: string;
  og_image: string;
  favicon_url: string;
};

const FIELDS: { key: keyof DefaultsState; label: string }[] = [
  { key: "default_news_cover", label: "Vignette actualité (défaut)" },
  { key: "default_live_thumb", label: "Thumbnail live (défaut)" },
  { key: "default_testimonial_1", label: "Portrait témoignage 1" },
  { key: "default_testimonial_2", label: "Portrait témoignage 2" },
  { key: "default_testimonial_anonymous", label: "Portrait anonyme" },
  { key: "about_founder", label: "Photo fondateur" },
  { key: "about_team", label: "Photo équipe" },
  { key: "og_image", label: "Image Open Graph" },
  { key: "favicon_url", label: "Favicon (PNG/SVG/WebP)" },
];

type Props = {
  defaults: DefaultsState;
  onChange: (d: DefaultsState) => void;
  onSaved: () => void;
};

export function DefaultsSection({ defaults, onChange, onSaved }: Props) {
  const { success, error } = useAdminToast();

  async function savePaths() {
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaults }),
    });
    if (!res.ok) {
      error("Échec enregistrement");
      return;
    }
    success("Defaults enregistrés");
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-admin-ctrl border border-admin-border bg-admin-bg/50 p-4 text-sm">
        <h4 className="font-semibold text-admin-ink">PWA — manifest</h4>
        <p className="mt-1 text-admin-muted">
          Nom : CFM — Cri de Familles Militaires · Thème : #1a2f4a · Fond : #f5f0e8
        </p>
        <a
          href="/manifest.json"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-admin-accent hover:underline"
        >
          Voir manifest.json →
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(({ key, label }) => (
          <MediaSlot
            key={key}
            label={label}
            value={defaults[key]}
            accept={key === "favicon_url" ? "image/*,.svg" : "image/jpeg,image/png,image/webp,image/heic,image/heif"}
            uploadOptions={{ settingKey: key, category: "defaults" }}
            onUploaded={(path) => {
              onChange({ ...defaults, [key]: path });
              onSaved();
            }}
            footer={
              <Input
                className="text-xs"
                placeholder="Chemin manuel (avancé)"
                value={defaults[key]}
                onChange={(e) => onChange({ ...defaults, [key]: e.target.value })}
              />
            }
          />
        ))}
      </div>

      <Button type="button" size="sm" onClick={savePaths}>
        Enregistrer chemins manuels
      </Button>
    </div>
  );
}
