"use client";

import Image from "next/image";
import { FileText, Video, Eye, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MediaItem = {
  path: string;
  alt?: string;
  category?: string;
  uploaded_at?: string;
};

export function mediaKind(path: string): "image" | "video" | "pdf" {
  if (path.toLowerCase().endsWith(".pdf")) return "pdf";
  if (/\.(mp4|webm|mov)$/i.test(path)) return "video";
  return "image";
}

type Props = {
  item: MediaItem;
  selected: boolean;
  onToggleSelect: () => void;
  onPreview: () => void;
  onCopy: () => void;
  onDelete: () => void;
};

/** Vignette de la bibliothèque : sélection + aperçu au clic + actions visibles. */
export function MediaCard({ item, selected, onToggleSelect, onPreview, onCopy, onDelete }: Props) {
  const kind = mediaKind(item.path);
  const name = item.path.split("/").pop();

  return (
    <div
      className={cn(
        "group relative rounded-admin-ctrl border bg-admin-surface p-2 shadow-admin-rest transition-colors",
        selected ? "border-admin-accent ring-1 ring-admin-accent" : "border-admin-border"
      )}
    >
      <label className="absolute left-3 top-3 z-10 flex cursor-pointer rounded bg-admin-surface/90 p-0.5 shadow-admin-rest backdrop-blur-sm">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Sélectionner ${name}`}
          className="h-4 w-4 cursor-pointer rounded border-admin-border accent-admin-accent"
        />
      </label>

      <button
        type="button"
        onClick={onPreview}
        aria-label={`Aperçu de ${name}`}
        className="relative block aspect-video w-full overflow-hidden rounded-admin-ctrl bg-admin-bg"
      >
        {kind === "image" && (
          <Image src={item.path} alt={item.alt || ""} fill className="object-cover" sizes="200px" />
        )}
        {kind === "video" && (
          <>
            <video src={item.path} className="h-full w-full object-cover" muted />
            <span className="absolute right-1.5 top-1.5 rounded bg-admin-ink/70 p-0.5 text-admin-surface">
              <Video className="h-3 w-3" />
            </span>
          </>
        )}
        {kind === "pdf" && (
          <span className="flex h-full flex-col items-center justify-center gap-1 text-admin-muted-2">
            <FileText className="h-6 w-6" strokeWidth={1.6} />
            <span className="text-[11px] font-medium">PDF</span>
          </span>
        )}
      </button>

      <p className="mt-1.5 truncate text-xs text-admin-muted" title={item.path}>
        {name}
      </p>

      <div className="mt-1.5 flex items-center gap-2 border-t border-admin-border pt-1.5">
        <button type="button" onClick={onPreview} aria-label="Aperçu" title="Aperçu" className="text-admin-muted-2 transition-colors hover:text-admin-ink">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onCopy} aria-label="Copier le chemin" title="Copier le chemin" className="text-admin-muted-2 transition-colors hover:text-admin-ink">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} aria-label="Supprimer" title="Supprimer" className="ml-auto text-admin-muted-2 transition-colors hover:text-admin-danger-fg">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
