"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { useMediaUpload } from "@/components/admin/hooks/useMediaUpload";
import { MediaSlot } from "@/components/admin/design/MediaSlot";
import { AXIS_SLUGS, type GalleryItem } from "@/domain/media";
import { AXES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

const AXIS_LABELS: Record<string, string> = Object.fromEntries(
  AXES.map((a) => [a.slug, a.title])
);

export function CollectionsSection() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [axes, setAxes] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { success, error } = useAdminToast();
  const { upload } = useMediaUpload();

  // Réordonnancement par glisser-déposer : déplace l'élément et republie l'ordre.
  function reorder(to: number) {
    const from = dragIndex;
    setDragIndex(null);
    if (from === null || from === to) return;
    const next = [...gallery];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const resorted = next.map((g, i) => ({ ...g, sort: i + 1 }));
    setGallery(resorted);
    void persistCollections(resorted, axes);
  }

  async function load() {
    const res = await fetch("/api/admin/media/collections");
    if (res.ok) {
      const data = await res.json();
      setGallery(data.fikin_gallery || []);
      setAxes(data.axis_images || {});
      setDirty(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function persistCollections(
    nextGallery: GalleryItem[],
    nextAxes: Record<string, string>
  ) {
    const res = await fetch("/api/admin/media/collections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fikin_gallery: nextGallery, axis_images: nextAxes }),
    });
    if (!res.ok) {
      error("Échec publication collections");
      return false;
    }
    success("Collections publiées sur le site");
    setDirty(false);
    load();
    return true;
  }

  async function saveAll() {
    await persistCollections(gallery, axes);
  }

  async function addGalleryItem(file: File) {
    const result = await upload(file, { category: "fikin" });
    if (!result) return;
    const nextGallery = [
      ...gallery,
      { src: result.path, alt: "", sort: gallery.length + 1 },
    ];
    setGallery(nextGallery);
    await persistCollections(nextGallery, axes);
  }

  return (
    <div className="space-y-10">
      {dirty && (
        <div className="rounded-admin-ctrl border border-admin-warn-fg/25 bg-admin-warn-bg px-4 py-2 text-sm text-admin-warn-fg">
          Modifications alt non publiées — cliquez « Enregistrer collections » pour mettre à jour le
          site.
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-admin-ink">Galerie FIKIN ({gallery.length})</h3>
          <label className="cursor-pointer text-sm text-admin-accent">
            + Photo
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void addGalleryItem(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="mb-3 text-xs font-medium text-admin-ok-fg">Upload = publication immédiate sur le site</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, i) => (
            <div
              key={item.src}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorder(i)}
              className={cn(
                "rounded-admin-ctrl border border-admin-border p-3 transition-opacity",
                dragIndex === i && "opacity-40"
              )}
            >
              <div
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragEnd={() => setDragIndex(null)}
                className="mb-2 flex cursor-grab items-center gap-1.5 text-admin-muted-2 active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
                <span className="text-[11px]">Glisser pour réordonner</span>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-admin-ctrl bg-admin-bg">
                <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="200px" />
              </div>
              <Input
                className="mt-2 text-xs"
                placeholder="Texte alt"
                value={item.alt}
                onChange={(e) => {
                  const v = e.target.value;
                  setDirty(true);
                  setGallery((prev) => prev.map((g, gi) => (gi === i ? { ...g, alt: v } : g)));
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-semibold text-admin-ink">Images des axes (×5)</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AXIS_SLUGS.map((slug) => (
            <MediaSlot
              key={slug}
              label={AXIS_LABELS[slug] || slug}
              value={axes[slug]}
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              uploadOptions={{ category: "axes" }}
              onUploaded={(path) => {
                const next = { ...axes, [slug]: path };
                setAxes(next);
                void persistCollections(gallery, next);
              }}
            />
          ))}
        </div>
      </section>

      <Button type="button" size="sm" onClick={saveAll} disabled={!dirty}>
        Enregistrer textes alt collections
      </Button>
    </div>
  );
}
