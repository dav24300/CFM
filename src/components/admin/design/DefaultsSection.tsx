"use client";

import Image from "next/image";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { AdminFileUpload } from "@/components/admin/ui/admin-file-upload";

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
          <div key={key} className="rounded-admin-ctrl border border-admin-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-admin-ink">{label}</p>
              <span className="text-[10px] font-medium text-admin-ok-fg">Publié si upload</span>
            </div>
            {defaults[key] && (
              <div className="relative mt-2 aspect-video overflow-hidden rounded bg-admin-bg">
                <Image src={defaults[key]} alt="" fill className="object-cover" sizes="160px" />
              </div>
            )}
            <Input
              className="mt-2 text-xs"
              value={defaults[key]}
              onChange={(e) => onChange({ ...defaults, [key]: e.target.value })}
            />
            <AdminFileUpload
              label="Upload"
              variant="inline"
              accept={key === "favicon_url" ? "image/*,.svg" : "image/jpeg,image/png,image/webp,image/heic,image/heif"}
              options={{ settingKey: key, category: "defaults" }}
              onUploaded={({ path }) => {
                onChange({ ...defaults, [key]: path });
                onSaved();
              }}
              className="mt-1 block"
            />
          </div>
        ))}
      </div>

      <Button type="button" size="sm" onClick={savePaths}>
        Enregistrer chemins manuels
      </Button>
    </div>
  );
}
