"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { MediaDropzone } from "@/components/admin/design/MediaDropzone";
import { MediaCard, mediaKind, type MediaItem } from "@/components/admin/design/MediaCard";
import { MediaLightbox } from "@/components/admin/design/MediaLightbox";
import { cn } from "@/lib/utils/cn";

type TypeFilter = "all" | "image" | "video" | "pdf";

export function MediaLibrarySection() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const { success, error } = useAdminToast();

  async function load() {
    const res = await fetch("/api/admin/media/library");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
    setSelected(new Set());
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { all: items.length, image: 0, video: 0, pdf: 0 };
    for (const it of items) c[mediaKind(it.path)]++;
    return c;
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((it) => {
        if (typeFilter !== "all" && mediaKind(it.path) !== typeFilter) return false;
        if (search.trim() && !it.path.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [items, typeFilter, search]
  );

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function copyPath(path: string) {
    void navigator.clipboard?.writeText(path);
    success("Chemin copié");
  }

  async function deleteOne(path: string): Promise<boolean> {
    const res = await fetch(`/api/admin/media/library?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error(data.error || "Suppression refusée");
      return false;
    }
    return true;
  }

  async function removeOne(path: string) {
    if (await deleteOne(path)) {
      success("Fichier supprimé");
      load();
    }
  }

  async function removeSelected() {
    setConfirmBulk(false);
    const paths = [...selected];
    let ok = 0;
    for (const p of paths) {
      if (await deleteOne(p)) ok++;
    }
    if (ok > 0) success(`${ok} fichier(s) supprimé(s)`);
    load();
  }

  async function cleanupOrphans() {
    const res = await fetch("/api/admin/media/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cleanup_orphans" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error("Nettoyage échoué");
      return;
    }
    success(`${data.count ?? 0} fichier(s) orphelin(s) supprimé(s)`);
    load();
  }

  const filters: { v: TypeFilter; label: string; count: number }[] = [
    { v: "all", label: "Tous", count: counts.all },
    { v: "image", label: "Images", count: counts.image },
    { v: "video", label: "Vidéos", count: counts.video },
    { v: "pdf", label: "PDF", count: counts.pdf },
  ];

  const noResults = filtered.length === 0;
  const isFiltering = search.trim() !== "" || typeFilter !== "all";

  return (
    <div className="space-y-4">
      <MediaDropzone category="library" onUploaded={load} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted-2" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-[180px] py-2 pl-9 text-sm sm:w-56"
              aria-label="Rechercher un média"
            />
          </div>
          {filters.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setTypeFilter(f.v)}
              aria-pressed={typeFilter === f.v}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                typeFilter === f.v
                  ? "border-admin-accent/40 bg-admin-accent/10 text-admin-accent"
                  : "border-admin-border text-admin-muted hover:bg-admin-bg hover:text-admin-ink"
              )}
            >
              {f.label}
              <span className="opacity-70">{f.count}</span>
            </button>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={cleanupOrphans}>
          Nettoyer les orphelins
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-admin-ctrl border border-admin-border bg-admin-accent/[0.07] px-4 py-2.5 animate-admin-pop-in motion-reduce:animate-none">
          <div className="flex items-center gap-2 text-[13px] font-medium text-admin-ink">
            <span className="font-display font-bold text-admin-accent">{selected.size}</span>
            sélectionné{selected.size > 1 ? "s" : ""}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-1 text-[12px] font-medium text-admin-muted-2 underline underline-offset-2 hover:text-admin-ink"
            >
              Désélectionner
            </button>
          </div>
          <Button type="button" size="sm" variant="destructive" onClick={() => setConfirmBulk(true)}>
            Supprimer la sélection
          </Button>
        </div>
      )}

      {noResults ? (
        <EmptyState
          icon={ImageIcon}
          title={isFiltering ? "Aucun résultat" : "Bibliothèque vide"}
          description={
            isFiltering
              ? "Aucun média ne correspond à ce filtre."
              : "Glissez des fichiers dans la zone ci-dessus pour enrichir la bibliothèque."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((item) => (
            <MediaCard
              key={item.path}
              item={item}
              selected={selected.has(item.path)}
              onToggleSelect={() => toggle(item.path)}
              onPreview={() => setPreview(item)}
              onCopy={() => copyPath(item.path)}
              onDelete={() => removeOne(item.path)}
            />
          ))}
        </div>
      )}

      <MediaLightbox item={preview} onClose={() => setPreview(null)} onCopy={copyPath} />

      <ConfirmDialog
        open={confirmBulk}
        title={`Supprimer ${selected.size} fichier(s) ?`}
        message="Les fichiers seront retirés de la bibliothèque. Ceux utilisés sur le site peuvent être refusés."
        destructive
        confirmLabel="Supprimer"
        onConfirm={removeSelected}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
