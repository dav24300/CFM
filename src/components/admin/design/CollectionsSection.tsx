"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { useMediaUpload } from "@/components/admin/hooks/useMediaUpload";
import { AXIS_SLUGS, type GalleryItem } from "@/domain/media";
import { AXES } from "@/lib/constants";

const AXIS_LABELS: Record<string, string> = Object.fromEntries(
  AXES.map((a) => [a.slug, a.title])
);

export function CollectionsSection() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [axes, setAxes] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const { success, error } = useAdminToast();
  const { upload } = useMediaUpload();

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

  async function uploadAxis(slug: string, file: File) {
    const result = await upload(file, { category: "axes" });
    if (!result) return;
    const nextAxes = { ...axes, [slug]: result.path };
    setAxes(nextAxes);
    await persistCollections(gallery, nextAxes);
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
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
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
        <p className="mb-3 text-xs text-green-800">Upload = publication immédiate sur le site</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item) => (
            <div key={item.sort} className="rounded-lg border p-3">
              <div className="relative aspect-video overflow-hidden rounded bg-admin-bg">
                <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="200px" />
              </div>
              <Input
                className="mt-2 text-xs"
                placeholder="Texte alt"
                value={item.alt}
                onChange={(e) => {
                  setDirty(true);
                  setGallery((prev) =>
                    prev.map((g) => (g.sort === item.sort ? { ...g, alt: e.target.value } : g))
                  );
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
            <div key={slug} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{AXIS_LABELS[slug] || slug}</p>
              {axes[slug] && (
                <div className="relative mt-2 aspect-video overflow-hidden rounded bg-admin-bg">
                  <Image src={axes[slug]} alt="" fill className="object-cover" sizes="160px" />
                </div>
              )}
              <label className="mt-2 block cursor-pointer text-xs text-admin-accent">
                Remplacer
                <input
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAxis(slug, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <Button type="button" size="sm" onClick={saveAll} disabled={!dirty}>
        Enregistrer textes alt collections
      </Button>
    </div>
  );
}
