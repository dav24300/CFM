"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { useFocusTrap } from "@/components/admin/ui/use-focus-trap";
import { MediaDropzone } from "@/components/admin/design/MediaDropzone";
import { mediaKind } from "@/components/admin/design/MediaCard";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  title?: string;
  accept?: string;
};

type Item = { path: string };

/**
 * Sélecteur de média (biblio) réutilisé partout : recherche + glisser-déposer
 * (upload dans la bibliothèque) + grille cliquable. API inchangée.
 */
export function MediaPicker({ open, onClose, onSelect, title = "Choisir un média", accept }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  const load = useCallback(() => {
    fetch("/api/admin/media/library")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      load();
    }
  }, [open, load]);

  // Fermeture au clavier (Échap) — ferme UNIQUEMENT le picker (modale du dessus).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Types acceptés déduits de `accept` (image/video/pdf) — filtre par type réel.
  const wantedKinds = useMemo(() => {
    if (!accept) return null;
    const kinds = accept
      .split(",")
      .map((a) => {
        const t = a.trim().toLowerCase();
        if (t.includes("pdf")) return "pdf" as const;
        if (t.startsWith("video/")) return "video" as const;
        if (t.startsWith("image/")) return "image" as const;
        return null;
      })
      .filter((k): k is "pdf" | "video" | "image" => k !== null);
    return kinds.length ? kinds : null;
  }, [accept]);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (wantedKinds && !wantedKinds.includes(mediaKind(i.path))) return false;
        if (search.trim() && !i.path.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [items, wantedKinds, search]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-admin-card border border-admin-border bg-admin-surface shadow-admin-overlay focus:outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-admin-border p-4">
          <h3 className="font-display font-semibold text-admin-ink">{title}</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-admin-muted-2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-40 py-1.5 pl-8 text-xs"
                aria-label="Rechercher un média"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-admin-ctrl p-1 text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-admin-border p-3">
          <MediaDropzone category="picker" accept={accept} onUploaded={load} />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-admin-muted">
              {search.trim() ? "Aucun résultat." : "Aucun média — déposez un fichier ci-dessus."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {filtered.map((item) => {
                const kind = mediaKind(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => onSelect(item.path)}
                    className="rounded-admin-ctrl border border-admin-border p-1 text-left transition-colors hover:border-admin-accent"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-admin-ctrl bg-admin-bg">
                      {kind === "pdf" ? (
                        <span className="flex h-full items-center justify-center text-admin-muted-2">
                          <FileText className="h-5 w-5" strokeWidth={1.6} />
                        </span>
                      ) : kind === "video" ? (
                        <video src={item.path} className="h-full w-full object-cover" muted />
                      ) : (
                        <Image src={item.path} alt="" fill className="object-cover" sizes="120px" />
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-admin-muted">{item.path.split("/").pop()}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
