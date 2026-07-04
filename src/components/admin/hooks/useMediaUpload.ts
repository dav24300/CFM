"use client";

import { useCallback, useState } from "react";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";

export type MediaUploadOptions = {
  settingKey?: string;
  category?: string;
  subdir?: string;
  alt?: string;
};

export type MediaUploadResult = {
  path: string;
  previewUrl: string;
  published: boolean;
  warnings: string[];
  settingKey: string | null;
};

type UploadErrorBody = {
  error?: string;
  code?: string;
  hint?: string;
};

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const { success, error } = useAdminToast();

  const upload = useCallback(
    async (file: File, options: MediaUploadOptions = {}): Promise<MediaUploadResult | null> => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        if (options.settingKey) form.append("settingKey", options.settingKey);
        if (options.category) form.append("category", options.category);
        if (options.subdir) form.append("subdir", options.subdir);
        if (options.alt) form.append("alt", options.alt);

        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        const data = (await res.json()) as MediaUploadResult & UploadErrorBody;

        if (!res.ok) {
          const detail = [data.error, data.hint].filter(Boolean).join(" — ");
          error(detail || "Upload échoué");
          return null;
        }

        const msg = data.published
          ? "Fichier uploadé et publié sur le site"
          : "Fichier en bibliothèque — publiez pour l'afficher sur le site";
        if (data.warnings?.length) {
          success(`${msg} (${data.warnings[0]})`);
        } else {
          success(msg);
        }

        return {
          path: data.path,
          previewUrl: data.previewUrl || data.path,
          published: Boolean(data.published),
          warnings: data.warnings || [],
          settingKey: data.settingKey ?? null,
        };
      } catch {
        error("Erreur réseau lors de l'upload");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [error, success]
  );

  return { upload, uploading };
}
