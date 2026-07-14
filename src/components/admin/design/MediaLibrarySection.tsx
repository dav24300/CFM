"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { useMediaUpload } from "@/components/admin/hooks/useMediaUpload";

type Item = {
  path: string;
  alt?: string;
  category?: string;
  uploaded_at?: string;
};

export function MediaLibrarySection() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const { success, error } = useAdminToast();
  const { upload, uploading } = useMediaUpload();

  async function load() {
    const res = await fetch("/api/admin/media/library");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadFiles(files: FileList | null) {
    if (!files) return;
    let okCount = 0;
    for (const file of Array.from(files)) {
      const result = await upload(file, { category: "library" });
      if (result) okCount++;
      else break;
    }
    if (okCount > 0) {
      success(`${okCount} fichier(s) en bibliothèque`);
      load();
    }
  }

  async function remove(path: string) {
    const res = await fetch(`/api/admin/media/library?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      error(data.error || "Suppression refusée");
      return;
    }
    success("Fichier supprimé");
    load();
  }

  async function cleanupOrphans() {
    const res = await fetch("/api/admin/media/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cleanup_orphans" }),
    });
    const data = await res.json();
    if (!res.ok) {
      error("Nettoyage échoué");
      return;
    }
    success(`${data.count ?? 0} fichier(s) orphelin(s) supprimé(s)`);
    load();
  }

  const filtered = items.filter((i) =>
    i.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-admin-muted">
        Les fichiers uploadés ici sont en <strong>bibliothèque</strong>. Assignez-les via le
        MediaPicker ou publiez depuis Hero / Defaults.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs text-sm"
        />
        <label className="cursor-pointer rounded-admin-ctrl bg-admin-deep px-3 py-2 text-sm text-white">
          {uploading ? "Upload…" : "Upload multiple"}
          <input
            type="file"
            multiple
            className="sr-only"
            accept="image/*,video/mp4,video/webm,application/pdf,.heic,.heif"
            disabled={uploading}
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </label>
        <span className="text-sm text-admin-muted">{filtered.length} fichier(s)</span>
        <Button type="button" size="sm" variant="secondary" onClick={cleanupOrphans}>
          Nettoyer orphelins
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((item) => (
          <div key={item.path} className="group rounded-admin-ctrl border border-admin-border bg-admin-surface p-2 shadow-admin-rest">
            <div className="relative aspect-video overflow-hidden rounded-admin-ctrl bg-admin-bg">
              {item.path.endsWith(".pdf") ? (
                <div className="flex h-full items-center justify-center text-xs text-admin-ink">PDF</div>
              ) : item.path.match(/\.(mp4|webm)$/i) ? (
                <video src={item.path} className="h-full w-full object-cover" muted />
              ) : (
                <Image src={item.path} alt={item.alt || ""} fill className="object-cover" sizes="120px" />
              )}
            </div>
            <p className="mt-1 truncate text-xs text-admin-muted" title={item.path}>
              {item.path.split("/").pop()}
            </p>
            <span className="text-[10px] font-medium uppercase tracking-wide text-admin-muted-2">Bibliothèque</span>
            <div className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                className="text-xs text-admin-accent"
                onClick={() => navigator.clipboard.writeText(item.path)}
              >
                Copier URL
              </button>
              <button type="button" className="text-xs text-admin-danger-fg" onClick={() => remove(item.path)}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
