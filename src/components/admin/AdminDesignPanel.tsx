"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/primitives/button";
import { SkeletonList } from "@/components/ui/primitives/skeleton";
import { cn } from "@/lib/utils/cn";

type MediaSettings = {
  hero_image: string;
  hero_poster: string;
  hero_video: string;
  mission_image: string;
};

const FIELDS: { key: keyof MediaSettings; label: string; accept?: string }[] = [
  { key: "hero_image", label: "Image hero accueil" },
  { key: "hero_poster", label: "Poster vidéo hero" },
  { key: "hero_video", label: "Vidéo hero (MP4/WebM)", accept: "video/mp4,video/webm" },
  { key: "mission_image", label: "Image section mission" },
];

export function AdminDesignPanel() {
  const [settings, setSettings] = useState<MediaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) setSettings(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(key: keyof MediaSettings, file: File) {
    setUploading(key);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    form.append("settingKey", key);

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMessage(`Média mis à jour : ${key}`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(null);
    }
  }

  if (loading) return <SkeletonList count={3} className="max-w-2xl" />;
  if (!settings) return <p className="text-red-600">Impossible de charger les médias.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Design & médias</h2>
        <button type="button" onClick={load} className="flex items-center gap-1 text-sm text-cfm-gold">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-cfm-cream px-4 py-2 text-sm text-cfm-navy">{message}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {FIELDS.map(({ key, label, accept }) => (
          <div key={key} className="card">
            <h3 className="font-semibold text-cfm-navy">{label}</h3>
            {settings[key] && key !== "hero_video" && (
              <div className="relative mt-3 aspect-video overflow-hidden rounded-lg bg-cfm-cream">
                <Image
                  src={settings[key]}
                  alt={label}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
            )}
            {settings[key] && key === "hero_video" && (
              <video src={settings[key]} controls className="mt-3 w-full rounded-lg" />
            )}
            <p className="mt-2 truncate text-xs text-gray-500">{settings[key] || "—"}</p>
            <label className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 inline-flex cursor-pointer")}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading === key ? "Upload..." : "Remplacer"}
              <input
                type="file"
                accept={accept || "image/jpeg,image/png,image/webp,image/svg+xml"}
                className="sr-only"
                disabled={uploading === key}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(key, f);
                }}
              />
            </label>
          </div>
        ))}
      </div>

      <p className="text-sm text-cfm-earth">
        Formats acceptés : JPG, PNG, WebP, SVG — max 5 Mo. Les placeholders SVG dans{" "}
        <code className="text-xs">public/media/</code> peuvent être remplacés par de vraies photos.
      </p>
    </div>
  );
}
