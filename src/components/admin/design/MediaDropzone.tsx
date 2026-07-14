"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadWithProgress } from "@/components/admin/design/uploadWithProgress";
import { useStorageAvailable } from "@/components/admin/design/useStorageAvailable";
import { cn } from "@/lib/utils/cn";

type QueueItem = {
  id: string;
  name: string;
  status: "queued" | "uploading" | "done" | "error";
  pct: number;
  error?: string;
};

type Props = {
  category?: string;
  accept?: string;
  onUploaded?: () => void;
  className?: string;
};

/**
 * Zone de dépôt (glisser-déposer + clic) avec upload en lot et progression réelle
 * par fichier. Désactivée en mode démo (sans Supabase Storage).
 */
export function MediaDropzone({
  category = "library",
  accept = "image/*,video/mp4,video/webm,application/pdf,.heic,.heif",
  onUploaded,
  className,
}: Props) {
  const storage = useStorageAvailable();
  const readonly = storage === false;
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const enqueue = useCallback(
    async (files: File[]) => {
      if (readonly || files.length === 0) return;
      const items: QueueItem[] = files.map((f) => ({
        id: `f${counter.current++}`,
        name: f.name,
        status: "queued",
        pct: 0,
      }));
      setQueue((q) => [...q, ...items]);

      let anyOk = false;
      for (let i = 0; i < files.length; i++) {
        const { id } = items[i];
        setQueue((q) => q.map((it) => (it.id === id ? { ...it, status: "uploading" } : it)));
        try {
          await uploadWithProgress(files[i], { category }, (pct) => {
            setQueue((q) => q.map((it) => (it.id === id ? { ...it, pct } : it)));
          });
          setQueue((q) => q.map((it) => (it.id === id ? { ...it, status: "done", pct: 100 } : it)));
          anyOk = true;
        } catch (e) {
          const message = e instanceof Error ? e.message : "Échec";
          setQueue((q) => q.map((it) => (it.id === id ? { ...it, status: "error", error: message } : it)));
        }
      }
      if (anyOk) onUploaded?.();
    },
    [readonly, category, onUploaded]
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (!readonly) void enqueue(Array.from(e.dataTransfer.files));
  }

  const activeCount = queue.filter((q) => q.status === "uploading" || q.status === "queued").length;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={readonly ? -1 : 0}
        aria-disabled={readonly}
        onClick={readonly ? undefined : () => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!readonly && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!readonly) setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-admin-card border-2 border-dashed px-6 py-9 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-admin-accent/40",
          readonly
            ? "cursor-not-allowed border-admin-border bg-admin-bg/50 opacity-70"
            : dragging
              ? "cursor-copy border-admin-accent bg-admin-accent/5"
              : "cursor-pointer border-admin-border bg-admin-surface hover:border-admin-accent/50 hover:bg-admin-bg/40"
        )}
      >
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
            dragging ? "bg-admin-accent/15 text-admin-accent" : "bg-admin-bg text-admin-muted-2"
          )}
        >
          <UploadCloud className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-admin-ink">
          {readonly
            ? "Upload désactivé (mode démo)"
            : dragging
              ? "Déposez pour uploader"
              : "Glissez des fichiers ici, ou cliquez pour choisir"}
        </p>
        {!readonly && (
          <p className="text-xs text-admin-muted-2">Images, vidéos (mp4/webm), PDF — plusieurs à la fois.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          disabled={readonly}
          className="sr-only"
          onChange={(e) => {
            void enqueue(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="mt-3 space-y-2">
          {queue.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-admin-ctrl border border-admin-border bg-admin-surface px-3 py-2"
            >
              <span className="shrink-0">
                {it.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-admin-ok-fg" />
                ) : it.status === "error" ? (
                  <AlertCircle className="h-4 w-4 text-admin-danger-fg" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-admin-accent" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-admin-ink">{it.name}</p>
                {it.status === "error" ? (
                  <p className="truncate text-[11px] text-admin-danger-fg">{it.error}</p>
                ) : (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-admin-bg">
                    <div
                      className="h-full rounded-full bg-admin-accent transition-all"
                      style={{ width: `${it.status === "done" ? 100 : it.pct}%` }}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
          {activeCount === 0 && (
            <li>
              <button
                type="button"
                onClick={() => setQueue([])}
                className="text-xs font-medium text-admin-muted-2 underline underline-offset-2 hover:text-admin-ink"
              >
                Effacer la liste
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
