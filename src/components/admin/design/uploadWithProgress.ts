export type UploadProgressOptions = {
  category?: string;
  settingKey?: string;
  subdir?: string;
  alt?: string;
};

export type UploadProgressResult = {
  path: string;
  published: boolean;
  warnings: string[];
};

type UploadResponse = {
  path?: string;
  published?: boolean;
  warnings?: string[];
  error?: string;
  hint?: string;
};

/**
 * Upload d'un fichier avec progression réelle (XHR — `fetch` n'émet pas d'événement
 * d'upload). Isolé du hook `useMediaUpload` partagé pour ne pas risquer les autres
 * appelants ; même endpoint et même charge multipart.
 */
export function uploadWithProgress(
  file: File,
  options: UploadProgressOptions = {},
  onProgress?: (pct: number) => void
): Promise<UploadProgressResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (options.settingKey) form.append("settingKey", options.settingKey);
    if (options.category) form.append("category", options.category);
    if (options.subdir) form.append("subdir", options.subdir);
    if (options.alt) form.append("alt", options.alt);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: UploadResponse = {};
      try {
        data = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        /* réponse non-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.path) {
        resolve({
          path: data.path,
          published: Boolean(data.published),
          warnings: data.warnings ?? [],
        });
      } else {
        const detail = [data.error, data.hint].filter(Boolean).join(" — ");
        reject(new Error(detail || `Upload échoué (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Erreur réseau lors de l'upload"));
    xhr.send(form);
  });
}
