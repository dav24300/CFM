import fs from "fs";
import path from "path";
import { UploadError } from "@/domain/media/upload-errors";
import type { MediaStoragePort } from "@/domain/media/storage.port";

const UPLOAD_DIR = path.join(process.cwd(), "public", "media", "uploads");

export function getLocalUploadDir(): string {
  return UPLOAD_DIR;
}

export const localStorageAdapter: MediaStoragePort = {
  async save(buffer, { safeName, subdir }): Promise<{ publicPath: string; absolutePath: string }> {
    const baseDir = subdir
      ? path.join(process.cwd(), "public", subdir.replace(/^\//, ""))
      : UPLOAD_DIR;

    try {
      fs.mkdirSync(baseDir, { recursive: true });
    } catch {
      throw new UploadError(
        "STORAGE_FAILED",
        "Impossible de créer le dossier d'upload.",
        "Vérifiez les permissions du dossier public/media sur le serveur.",
        500
      );
    }

    const absolutePath = path.join(baseDir, safeName);
    try {
      fs.writeFileSync(absolutePath, buffer);
    } catch {
      throw new UploadError(
        "STORAGE_FAILED",
        "Échec écriture du fichier sur le disque.",
        "Vérifiez l'espace disque et le volume Docker cfm_media_uploads (VPS).",
        500
      );
    }

    const publicPath = subdir
      ? `/${subdir.replace(/^\//, "")}/${safeName}`
      : `/media/uploads/${safeName}`;

    return { publicPath, absolutePath };
  },

  async delete(publicPath): Promise<boolean> {
    const relative = publicPath.replace(/^\//, "");
    const full = path.join(process.cwd(), "public", relative);
    if (!full.includes("media")) return false;
    if (!fs.existsSync(full)) return false;
    fs.unlinkSync(full);
    return true;
  },

  exists(publicPath): boolean {
    if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
      return false;
    }
    const full = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    return fs.existsSync(full);
  },
};
