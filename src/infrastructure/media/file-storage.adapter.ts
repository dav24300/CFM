import fs from "fs";
import path from "path";
import { UploadError } from "@/domain/media/upload-errors";
import { getLocalUploadDir } from "@/infrastructure/media/local-storage.adapter";
import { getMediaStorage, isSupabaseStorageEnabled } from "@/infrastructure/media/storage.factory";
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
  if (isServerlessRuntime() && !isSupabaseStorageEnabled()) {
    throw new UploadError(
      "STORAGE_READONLY",
      "Upload impossible sur l'environnement démo (disque non persistant).",
      "Configurez Supabase Storage (Vercel) ou utilisez le VPS / local.",
      503
    );
  }
  if (!isSupabaseStorageEnabled()) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
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
  if (isServerlessRuntime() && !isSupabaseStorageEnabled()) {
    throw new UploadError(
      "STORAGE_READONLY",
      "Upload désactivé — stockage cloud non configuré.",
      "Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sur Vercel, ou utilisez le VPS.",
      503
    );
  }

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new UploadError(validation.code, validation.message, validation.hint, 400);
  }

  const raw = Buffer.from(await file.arrayBuffer());
  const { buffer, ext, warnings } = await processBuffer(raw, validation.mime);
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const stored = await getMediaStorage().save(buffer, {
    safeName,
    mime: validation.mime,
    subdir,
  });

  return { publicPath: stored.publicPath, absolutePath: stored.absolutePath, warnings };
}

export async function deletePublicMediaFile(publicPath: string): Promise<boolean> {
  return getMediaStorage().delete(publicPath);
}

export function listOrphanUploadFiles(
  catalogPaths: Set<string>
): { path: string; uploaded_at: string }[] {
  if (isSupabaseStorageEnabled()) {
    return [];
  }

  const fromDisk: { path: string; uploaded_at: string }[] = [];
  const uploadDir = getLocalUploadDir();
  if (!fs.existsSync(uploadDir)) return fromDisk;

  for (const name of fs.readdirSync(uploadDir)) {
    const full = path.join(uploadDir, name);
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

// Mémoïsation au niveau process : les fichiers de public/ (et les objets de
// storage distant résolus) sont immuables au runtime, donc un même chemin n'a
// besoin d'être vérifié qu'une seule fois. Évite un fs.existsSync (ou un
// exists() storage) synchrone par image à chaque rendu RSC. La fonction reste
// SYNCHRONE pour ne pas propager une cascade async à travers tous les resolvers.
const fileExistsCache = new Map<string, boolean>();

export function publicFileExists(publicPath: string): boolean {
  const cached = fileExistsCache.get(publicPath);
  if (cached !== undefined) return cached;

  let result: boolean;
  if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
    result = getMediaStorage().exists(publicPath);
  } else {
    const full = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    result = fs.existsSync(full);
  }

  fileExistsCache.set(publicPath, result);
  return result;
}

export function isUploadStorageAvailable(): boolean {
  if (isSupabaseStorageEnabled()) return true;
  return !isServerlessRuntime();
}
