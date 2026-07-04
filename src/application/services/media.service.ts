import type { GalleryItem, MediaAssignTarget, MediaCatalogEntry } from "@/domain/media";
import { isAssignableMediaKey } from "@/domain/media";
import { UploadError } from "@/domain/media/upload-errors";
import {
  addToCatalog,
  assignMediaToEntity,
  cleanupOrphanUploadFiles,
  deleteFikinGalleryItem,
  findMediaUsages,
  getCollectionsState,
  getFullMediaState,
  listLibraryFiles,
  patchAssignableSettings,
  patchCollectionItem,
  patchDefaultSettings,
  patchHeroSettings,
  removeFromCatalog,
  replaceCollections,
  resetHeroSettings,
  scanMissingMedia,
  setSiteSetting,
  updateCatalogMeta,
} from "@/infrastructure/media/media.repository";
import {
  deletePublicMediaFile,
  saveUploadedFile,
} from "@/infrastructure/media/file-storage.adapter";
import { invalidateMediaCache } from "@/infrastructure/cache/invalidate-media";

function afterMediaMutation() {
  invalidateMediaCache();
}

export function getMediaState() {
  return getFullMediaState();
}

export function getMediaLibrary(usagePath?: string | null) {
  if (usagePath) {
    return { usages: findMediaUsages(usagePath) };
  }
  return { items: listLibraryFiles() };
}

export function getMediaCollections() {
  return getCollectionsState();
}

export function getMissingMedia() {
  const missing = scanMissingMedia();
  return { missing, count: missing.length };
}

export async function uploadMediaFile(params: {
  file: File;
  settingKey?: string | null;
  category?: string;
  subdir?: string | null;
  alt?: string | null;
}): Promise<{
  path: string;
  settingKey: string | null;
  previewUrl: string;
  published: boolean;
  warnings: string[];
}> {
  if (params.settingKey && !isAssignableMediaKey(params.settingKey)) {
    throw new UploadError(
      "INVALID_SETTING_KEY",
      "Clé de paramètre invalide pour cet upload.",
      "Contactez le support si le problème persiste.",
      400
    );
  }

  const { publicPath, warnings } = await saveUploadedFile(
    params.file,
    params.subdir || undefined
  );

  const published = Boolean(params.settingKey);

  if (params.settingKey) {
    setSiteSetting(params.settingKey, publicPath);
  }

  addToCatalog({
    path: publicPath,
    category: params.category || "upload",
    alt: params.alt || undefined,
    tags: params.category ? [params.category] : undefined,
  });

  afterMediaMutation();
  return {
    path: publicPath,
    settingKey: params.settingKey || null,
    previewUrl: publicPath,
    published,
    warnings,
  };
}

export function patchMediaSettings(body: Record<string, unknown>): void {
  if (body.action === "reset_hero") {
    resetHeroSettings();
    afterMediaMutation();
    return;
  }

  if (body.hero && typeof body.hero === "object") {
    patchHeroSettings(body.hero as Record<string, string>);
  }
  if (body.defaults && typeof body.defaults === "object") {
    patchDefaultSettings(body.defaults as Record<string, string>);
  }
  patchAssignableSettings(body);
  afterMediaMutation();
}

export function updateLibraryMeta(
  assetPath: string,
  patch: Partial<MediaCatalogEntry>
): void {
  updateCatalogMeta(assetPath, patch);
}

export function deleteLibraryAsset(assetPath: string): { blocked: boolean; usages: string[] } {
  const usages = findMediaUsages(assetPath);
  if (usages.length > 0) {
    return { blocked: true, usages };
  }
  deletePublicMediaFile(assetPath);
  removeFromCatalog(assetPath);
  afterMediaMutation();
  return { blocked: false, usages: [] };
}

export function saveMediaCollections(body: {
  fikin_gallery?: GalleryItem[];
  axis_images?: Record<string, string>;
}): void {
  replaceCollections(body);
  afterMediaMutation();
}

export function patchMediaCollection(body: {
  type?: "fikin" | "axis";
  item?: GalleryItem;
  slug?: string;
  src?: string;
}): void {
  patchCollectionItem(body);
  afterMediaMutation();
}

export function removeFikinItem(sort: number): void {
  deleteFikinGalleryItem(sort);
  afterMediaMutation();
}

export function assignMedia(params: {
  type: MediaAssignTarget;
  id: number;
  field: string;
  path: string;
}): boolean {
  const ok = assignMediaToEntity(params);
  if (ok) afterMediaMutation();
  return ok;
}

export function cleanupOrphanUploads(): { removed: string[]; count: number } {
  const removed = cleanupOrphanUploadFiles();
  if (removed.length > 0) afterMediaMutation();
  return { removed, count: removed.length };
}

// Re-export read resolvers for pages that import via application layer
export {
  getSiteMedia,
  getResolvedGallery,
  getResolvedAxisImage,
  getResolvedAboutMedia,
  getResolvedLiveThumb,
  getResolvedNewsCover,
  getResolvedTestimonialPhoto,
  getPressKitPath,
  getOgImagePath,
  getFaviconPath,
  getActionsHeroImage,
  resolveMediaPath,
} from "@/infrastructure/media/media-resolution.server";
