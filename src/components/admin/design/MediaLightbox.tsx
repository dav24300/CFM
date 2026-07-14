"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Copy, ExternalLink, FileText } from "lucide-react";
import { useFocusTrap } from "@/components/admin/ui/use-focus-trap";
import { mediaKind, type MediaItem } from "@/components/admin/design/MediaCard";

function formatDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("fr-FR");
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[12px] uppercase tracking-wide text-admin-muted-2">{label}</dt>
      <dd className="truncate text-right font-medium text-admin-ink">{value}</dd>
    </div>
  );
}

type Props = {
  item: MediaItem | null;
  onClose: () => void;
  onCopy: (path: string) => void;
};

/** Aperçu plein écran d'un média + métadonnées (type, catégorie, dimensions, date). */
export function MediaLightbox({ item, onClose, onCopy }: Props) {
  const reduced = useReducedMotion();
  const ref = useFocusTrap<HTMLDivElement>(!!item);
  const [dims, setDims] = useState("—");
  const [usages, setUsages] = useState<string[] | "error" | null>(null);

  // Réinitialise les dimensions + récupère « où est-ce utilisé » au changement de
  // média uniquement (pas à chaque re-render du parent — sinon un toast effacerait
  // « 1920 × 1080 » vers « — »).
  useEffect(() => {
    setDims("—");
    setUsages(null);
    const path = item?.path;
    if (!path) return;
    let alive = true;
    fetch(`/api/admin/media/library?usage=${encodeURIComponent(path)}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        if (alive) setUsages(Array.isArray(d.usages) ? d.usages : "error");
      })
      .catch(() => {
        if (alive) setUsages("error");
      });
    return () => {
      alive = false;
    };
  }, [item?.path]);

  // Fermeture au clavier (Échap), effet séparé (dépend de onClose non mémoïsé).
  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  const kind = item ? mediaKind(item.path) : "image";
  const name = item?.path.split("/").pop() ?? "";

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key="media-lightbox"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Aperçu de ${name}`}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-admin-card border border-admin-border bg-admin-surface shadow-admin-overlay focus:outline-none md:flex-row"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-admin-bg p-4">
              {kind === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.path}
                  alt={item.alt || name}
                  className="max-h-[70vh] max-w-full rounded-admin-ctrl object-contain"
                  onLoad={(e) => setDims(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight} px`)}
                />
              )}
              {kind === "video" && (
                <video src={item.path} controls className="max-h-[70vh] max-w-full rounded-admin-ctrl" />
              )}
              {kind === "pdf" && (
                <a
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 text-admin-muted"
                >
                  <FileText className="h-10 w-10" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-admin-accent hover:underline">Ouvrir le PDF →</span>
                </a>
              )}
            </div>

            <aside className="w-full shrink-0 border-t border-admin-border p-5 md:w-72 md:border-l md:border-t-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="break-all font-display text-sm font-semibold text-admin-ink">{name}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="shrink-0 rounded-admin-ctrl p-1 text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <dl className="mt-4 space-y-2.5 text-[13px]">
                <MetaRow label="Type" value={kind.toUpperCase()} />
                <MetaRow label="Catégorie" value={item.category || "—"} />
                <MetaRow label="Dimensions" value={dims} />
                <MetaRow label="Ajouté le" value={formatDate(item.uploaded_at)} />
              </dl>

              <div className="mt-4">
                <p className="text-[12px] uppercase tracking-wide text-admin-muted-2">Utilisé dans</p>
                {usages === null ? (
                  <p className="mt-1 text-[13px] text-admin-muted-2">Vérification…</p>
                ) : usages === "error" ? (
                  <p className="mt-1 text-[13px] text-admin-warn-fg">Vérification impossible — usage inconnu.</p>
                ) : usages.length === 0 ? (
                  <p className="mt-1 text-[13px] text-admin-muted">Aucun emplacement — suppression possible.</p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {usages.map((u, i) => (
                      <li key={`${u}-${i}`} className="flex items-start gap-2 text-[13px] text-admin-ink">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-admin-accent" />
                        <span className="min-w-0 break-words">{u}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onCopy(item.path)}
                  className="inline-flex items-center gap-1.5 rounded-admin-ctrl border border-admin-border px-2.5 py-1.5 text-xs font-medium text-admin-ink transition-colors hover:bg-admin-bg"
                >
                  <Copy className="h-3.5 w-3.5" /> Copier le chemin
                </button>
                <a
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-admin-ctrl border border-admin-border px-2.5 py-1.5 text-xs font-medium text-admin-ink transition-colors hover:bg-admin-bg"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                </a>
              </div>

              <p className="mt-3 break-all rounded-admin-ctrl bg-admin-bg px-2.5 py-1.5 font-mono text-[11px] text-admin-muted-2">
                {item.path}
              </p>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
