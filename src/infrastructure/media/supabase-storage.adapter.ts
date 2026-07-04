import { UploadError } from "@/domain/media/upload-errors";
import type { MediaStoragePort, StoredObject } from "@/domain/media/storage.port";

export const SUPABASE_MEDIA_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "media-uploads";

export function isSupabaseStorageEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!url) {
    throw new UploadError(
      "STORAGE_FAILED",
      "Configuration Supabase Storage manquante.",
      "Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sur Vercel.",
      500
    );
  }
  return url;
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new UploadError(
      "STORAGE_FAILED",
      "Clé Supabase service role manquante.",
      "Ajoutez SUPABASE_SERVICE_ROLE_KEY dans les variables Vercel (secret).",
      500
    );
  }
  return key;
}

export function toObjectPath(safeName: string, subdir?: string): string {
  if (!subdir) return `uploads/${safeName}`;
  const normalized = subdir.replace(/^\//, "").replace(/^media\//, "");
  return `${normalized}/${safeName}`;
}

export function toPublicUrl(objectPath: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${SUPABASE_MEDIA_BUCKET}/${objectPath}`;
}

export function publicPathToObjectPath(publicPath: string): string | null {
  if (!publicPath.startsWith("http")) return null;
  const marker = `/storage/v1/object/public/${SUPABASE_MEDIA_BUCKET}/`;
  const idx = publicPath.indexOf(marker);
  if (idx === -1) return null;
  return publicPath.slice(idx + marker.length);
}

export const supabaseStorageAdapter: MediaStoragePort = {
  async save(buffer, { safeName, mime, subdir }): Promise<StoredObject> {
    const objectPath = toObjectPath(safeName, subdir);
    const url = `${getSupabaseUrl()}/storage/v1/object/${SUPABASE_MEDIA_BUCKET}/${objectPath}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getServiceKey()}`,
        "Content-Type": mime,
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new UploadError(
        "STORAGE_FAILED",
        "Échec upload vers Supabase Storage.",
        detail.includes("Bucket not found")
          ? `Créez le bucket public « ${SUPABASE_MEDIA_BUCKET} » dans Supabase.`
          : "Vérifiez SUPABASE_URL, la clé service role et les policies du bucket.",
        500
      );
    }

    const publicPath = toPublicUrl(objectPath);
    return { publicPath, absolutePath: publicPath };
  },

  async delete(publicPath): Promise<boolean> {
    const objectPath = publicPathToObjectPath(publicPath);
    if (!objectPath) return false;

    const url = `${getSupabaseUrl()}/storage/v1/object/${SUPABASE_MEDIA_BUCKET}/${objectPath}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getServiceKey()}` },
    });
    return res.ok;
  },

  exists(publicPath): boolean {
    if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
      return publicPath.includes(`/storage/v1/object/public/${SUPABASE_MEDIA_BUCKET}/`);
    }
    return false;
  },
};
