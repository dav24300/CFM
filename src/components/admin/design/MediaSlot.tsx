"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { FileText, ImageOff, ImagePlus } from "lucide-react";
import { AdminFileUpload } from "@/components/admin/ui/admin-file-upload";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import { PublishBadge, type PublishState } from "@/components/admin/design/PublishBadge";
import { useStorageAvailable } from "@/components/admin/design/useStorageAvailable";
import type { MediaUploadOptions } from "@/components/admin/hooks/useMediaUpload";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  value?: string;
  accept?: string;
  kind?: "image" | "video" | "pdf";
  uploadOptions: MediaUploadOptions;
  onUploaded: (path: string) => void;
  uploadLabel?: string;
  /** État affiché. Défaut : `online` si un fichier est présent, sinon `fallback`. */
  state?: PublishState;
  /** Lien « Voir sur le site » (affiché seulement si un fichier est présent). */
  siteHref?: string;
  help?: string;
  /** Contenu avancé rendu en bas de la carte (ex. saisie de chemin manuel). */
  footer?: ReactNode;
  className?: string;
};

/**
 * Emplacement média du site : aperçu + état de publication + upload fiable
 * (désactivé en mode démo) + lien « Voir sur le site ». Brique unifiée des
 * onglets Hero / Defaults / Collections / Presse.
 */
export function MediaSlot({
  label,
  value,
  accept,
  kind = "image",
  uploadOptions,
  onUploaded,
  uploadLabel = "Remplacer",
  state,
  siteHref,
  help,
  footer,
  className,
}: Props) {
  const storage = useStorageAvailable();
  const readonly = storage === false;
  const [pickerOpen, setPickerOpen] = useState(false);
  const resolvedState: PublishState = state ?? (value ? "online" : "fallback");

  return (
    <>
    <div className={cn("rounded-admin-card border border-admin-border bg-admin-surface p-4 shadow-admin-rest", className)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="truncate font-display text-sm font-semibold text-admin-ink">{label}</h4>
        <PublishBadge state={resolvedState} />
      </div>

      <div className="relative mt-3 aspect-video overflow-hidden rounded-admin-ctrl border border-admin-border bg-admin-bg">
        {value && kind === "image" && (
          <Image src={value} alt={label} fill className="object-cover" sizes="260px" />
        )}
        {value && kind === "video" && (
          <video src={value} controls className="h-full w-full object-cover" />
        )}
        {value && kind === "pdf" && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-admin-muted-2">
            <FileText className="h-6 w-6" strokeWidth={1.6} />
            <span className="text-xs font-medium">PDF</span>
          </div>
        )}
        {!value && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-admin-muted-2">
            <ImageOff className="h-6 w-6" strokeWidth={1.6} />
            <span className="text-[11px]">Aucun visuel</span>
          </div>
        )}
      </div>

      <p className="mt-1.5 truncate text-xs text-admin-muted-2" title={value || undefined}>
        {value ? value.split("/").pop() : "Le site affiche un visuel par défaut."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-admin-ctrl border border-admin-border px-2.5 py-2 text-sm font-medium text-admin-ink transition-colors hover:bg-admin-bg"
        >
          <ImagePlus className="h-3.5 w-3.5" /> Choisir…
        </button>
        <AdminFileUpload
          label={uploadLabel}
          accept={accept}
          options={uploadOptions}
          onUploaded={({ path }) => onUploaded(path)}
          disabled={readonly}
        />
        {siteHref && value && (
          <a
            href={siteHref}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs font-medium text-admin-accent hover:underline"
          >
            Voir sur le site →
          </a>
        )}
      </div>

      {readonly ? (
        <p className="mt-2 text-xs text-admin-warn-fg">Import désactivé (mode démo). « Choisir… » reste possible.</p>
      ) : (
        help && <p className="mt-2 text-xs text-admin-muted">{help}</p>
      )}

      {footer && <div className="mt-3 border-t border-admin-border pt-3">{footer}</div>}
    </div>

    <MediaPicker
      open={pickerOpen}
      onClose={() => setPickerOpen(false)}
      onSelect={(path) => {
        onUploaded(path);
        setPickerOpen(false);
      }}
      title={`Choisir — ${label}`}
      accept={accept}
    />
    </>
  );
}
