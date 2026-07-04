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

export async function getMediaState() {
  return getFullMediaState();
}

export async function getMediaLibrary(usagePath?: string | null) {
  if (usagePath) {
    return { usages: await findMediaUsages(usagePath) };
  }
  return { items: await listLibraryFiles() };
}

export async function getMediaCollections() {
  return getCollectionsState();
}

export async function getMissingMedia() {
  const missing = await scanMissingMedia();
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
    await setSiteSetting(params.settingKey, publicPath);
  }

  await addToCatalog({
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

export async function patchMediaSettings(body: Record<string, unknown>): Promise<void> {
  if (body.action === "reset_hero") {
    await resetHeroSettings();
    afterMediaMutation();
    return;
  }

  if (body.hero && typeof body.hero === "object") {
    await patchHeroSettings(body.hero as Record<string, string>);
  }
  if (body.defaults && typeof body.defaults === "object") {
    await patchDefaultSettings(body.defaults as Record<string, string>);
  }
  await patchAssignableSettings(body);
  afterMediaMutation();
}

export async function updateLibraryMeta(
  assetPath: string,
  patch: Partial<MediaCatalogEntry>
): Promise<void> {
  await updateCatalogMeta(assetPath, patch);
}

export async function deleteLibraryAsset(
  assetPath: string
): Promise<{ blocked: boolean; usages: string[] }> {
  const usages = await findMediaUsages(assetPath);
  if (usages.length > 0) {
    return { blocked: true, usages };
  }
  await deletePublicMediaFile(assetPath);
  await removeFromCatalog(assetPath);
  afterMediaMutation();
  return { blocked: false, usages: [] };
}

export async function saveMediaCollections(body: {
  fikin_gallery?: GalleryItem[];
  axis_images?: Record<string, string>;
}): Promise<void> {
  await replaceCollections(body);
  afterMediaMutation();
}

export async function patchMediaCollection(body: {
  type?: "fikin" | "axis";
  item?: GalleryItem;
  slug?: string;
  src?: string;
}): Promise<void> {
  await patchCollectionItem(body);
  afterMediaMutation();
}

export async function removeFikinItem(sort: number): Promise<void> {
  await deleteFikinGalleryItem(sort);
  afterMediaMutation();
}

export async function assignMedia(params: {
  type: MediaAssignTarget;
  id: number;
  field: string;
  path: string;
}): Promise<boolean> {
  const ok = await assignMediaToEntity(params);
  if (ok) afterMediaMutation();
  return ok;
}

export async function cleanupOrphanUploads(): Promise<{ removed: string[]; count: number }> {
  const removed = await cleanupOrphanUploadFiles();
  if (removed.length > 0) afterMediaMutation();
  return { removed, count: removed.length };
}

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
