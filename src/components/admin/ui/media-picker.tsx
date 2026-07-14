"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useMediaUpload } from "@/components/admin/hooks/useMediaUpload";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  title?: string;
  accept?: string;
};

type Item = { path: string };

export function MediaPicker({ open, onClose, onSelect, title = "Choisir un média", accept }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const { upload, uploading } = useMediaUpload();

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/media/library")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, [open]);

  if (!open) return null;

  async function quickUpload(file: File) {
    const result = await upload(file, { category: "picker" });
    if (result) {
      onSelect(result.path);
      setItems((prev) => [{ path: result.path }, ...prev]);
    }
  }

  const filtered = accept
    ? items.filter((i) => {
        if (accept.includes("pdf")) return i.path.endsWith(".pdf");
        return !i.path.endsWith(".pdf");
      })
    : items;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-admin-card border border-admin-border bg-admin-surface shadow-admin-overlay">
        <div className="flex items-center justify-between border-b border-admin-border p-4">
          <h3 className="font-display font-semibold text-admin-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-admin-muted transition-colors hover:text-admin-ink">
            Fermer
          </button>
        </div>
        <div className="border-b border-admin-border p-3">
          <label className="cursor-pointer text-sm text-admin-accent">
            {uploading ? "Upload…" : "+ Nouveau fichier"}
            <input
              type="file"
              className="sr-only"
              accept={accept || "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,video/mp4"}
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void quickUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.path}
                type="button"
                className="rounded-admin-ctrl border border-admin-border p-1 text-left transition-colors hover:border-admin-accent"
                onClick={() => onSelect(item.path)}
              >
                <div className="relative aspect-video overflow-hidden rounded bg-admin-bg">
                  {item.path.endsWith(".pdf") ? (
                    <span className="flex h-full items-center justify-center text-xs">PDF</span>
                  ) : (
                    <Image src={item.path} alt="" fill className="object-cover" sizes="100px" />
                  )}
                </div>
                <p className="mt-1 truncate text-xs">{item.path.split("/").pop()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
