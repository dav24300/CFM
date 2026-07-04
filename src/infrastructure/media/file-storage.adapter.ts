import fs from "fs";
import path from "path";
import { UploadError } from "@/domain/media/upload-errors";
import { isServerlessRuntime } from "@/lib/runtime";

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAX_PDF_SIZE = 20 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
/** @deprecated use MAX_IMAGE_SIZE */
export const MAX_UPLOAD_SIZE = MAX_IMAGE_SIZE;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "media", "uploads");

export const PRESSE_DIR = path.join(process.cwd(), "public", "media", "presse");

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

export function ensureUploadDir(): void {
  if (isServerlessRuntime()) {
    throw new UploadError(
      "STORAGE_READONLY",
      "Upload impossible sur l'environnement démo (disque non persistant).",
      "Utilisez le VPS production ou uploadez en local puis déployez les médias.",
      503
    );
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_MIME.has(file.type)) {
    return file.type;
  }
  const ext = (file.name || "").split(".").pop()?.toLowerCase() || "";
  return EXT_TO_MIME[ext] || file.type || "";
}

function maxSizeForMime(mime: string): number {
  if (mime.startsWith("video/")) return MAX_VIDEO_SIZE;
  if (mime === "application/pdf") return MAX_PDF_SIZE;
  return MAX_IMAGE_SIZE;
}

export type ValidateResult =
  | { ok: true; mime: string }
  | { ok: false; code: UploadError["code"]; message: string; hint: string };

export function validateUploadFile(file: File): ValidateResult {
  const mime = resolveMimeType(file);

  if (!mime || !ALLOWED_MIME.has(mime)) {
    return {
      ok: false,
      code: "MIME_REJECTED",
      message: `Type de fichier non autorisé (${file.name}).`,
      hint: "Formats acceptés : JPG, PNG, WebP, SVG, HEIC, PDF, MP4.",
    };
  }

  const maxSize = maxSizeForMime(mime);
  if (file.size > maxSize) {
    const maxMo = Math.round(maxSize / (1024 * 1024));
    return {
      ok: false,
      code: "TOO_LARGE",
      message: `Fichier trop volumineux (max ${maxMo} Mo pour ce type).`,
      hint: "Réduisez la taille ou exportez en JPEG/WebP depuis votre téléphone.",
    };
  }

  return { ok: true, mime };
}

function sanitizeSvgBuffer(buffer: Buffer): Buffer {
  const text = buffer.toString("utf-8");
  if (!text.includes("<svg")) return buffer;
  const cleaned = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return Buffer.from(cleaned, "utf-8");
}

const HEIC_MIMES = new Set(["image/heic", "image/heif"]);
const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp", ...HEIC_MIMES]);

async function processBuffer(
  raw: Buffer,
  mime: string
): Promise<{ buffer: Buffer; ext: string; warnings: string[] }> {
  const warnings: string[] = [];

  if (mime === "image/svg+xml") {
    return { buffer: sanitizeSvgBuffer(raw), ext: "svg", warnings };
  }

  if (HEIC_MIMES.has(mime)) {
    try {
      const sharp = (await import("sharp")).default;
      const out = await sharp(raw)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      warnings.push("HEIC converti en WebP pour le web.");
      return { buffer: out, ext: "webp", warnings };
    } catch {
      throw new UploadError(
        "CONVERT_FAILED",
        "Impossible de convertir la photo HEIC.",
        "Exportez la photo en JPG depuis votre galerie iPhone, ou réessayez.",
        400
      );
    }
  }

  const shouldCompress =
    process.env.CFM_IMAGE_COMPRESS === "true" && COMPRESSIBLE.has(mime);

  if (shouldCompress) {
    try {
      const sharp = (await import("sharp")).default;
      const out = await sharp(raw)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      return { buffer: out, ext: "webp", warnings };
    } catch {
      /* fallback below */
    }
  }

  const ext =
    mime === "image/jpeg"
      ? "jpg"
      : mime === "image/png"
        ? "png"
        : mime === "application/pdf"
          ? "pdf"
          : mime.split("/")[1] || "bin";
  return { buffer: raw, ext, warnings };
}

export async function saveUploadedFile(
  file: File,
  subdir?: string
): Promise<{ publicPath: string; absolutePath: string; warnings: string[] }> {
  if (isServerlessRuntime()) {
    throw new UploadError(
      "STORAGE_READONLY",
      "Upload désactivé sur Netlify démo (stockage non persistant).",
      "Connectez-vous à l'admin sur le VPS production pour uploader des médias.",
      503
    );
  }

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new UploadError(validation.code, validation.message, validation.hint, 400);
  }

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

  const raw = Buffer.from(await file.arrayBuffer());
  const { buffer, ext, warnings } = await processBuffer(raw, validation.mime);
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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

  return { publicPath, absolutePath, warnings };
}

export function deletePublicMediaFile(publicPath: string): boolean {
  const relative = publicPath.replace(/^\//, "");
  const full = path.join(process.cwd(), "public", relative);
  if (!full.includes("media")) return false;
  if (!fs.existsSync(full)) return false;
  fs.unlinkSync(full);
  return true;
}

export function listOrphanUploadFiles(
  catalogPaths: Set<string>
): { path: string; uploaded_at: string }[] {
  const fromDisk: { path: string; uploaded_at: string }[] = [];
  if (!fs.existsSync(UPLOAD_DIR)) return fromDisk;

  for (const name of fs.readdirSync(UPLOAD_DIR)) {
    const full = path.join(UPLOAD_DIR, name);
    if (!fs.statSync(full).isFile()) continue;
    const publicPath = `/media/uploads/${name}`;
    if (!catalogPaths.has(publicPath)) {
      fromDisk.push({
        path: publicPath,
        uploaded_at: fs.statSync(full).mtime.toISOString(),
      });
    }
  }
  return fromDisk;
}

export function publicFileExists(publicPath: string): boolean {
  const full = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  return fs.existsSync(full);
}

export function isUploadStorageAvailable(): boolean {
  return !isServerlessRuntime();
}
