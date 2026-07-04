/** @deprecated Utiliser @/infrastructure/media/file-storage.adapter et @/infrastructure/media/media.repository */
export {
  ALLOWED_MIME,
  MAX_UPLOAD_SIZE as MAX_SIZE,
  PRESSE_DIR,
  ensureUploadDir,
  saveUploadedFile,
} from "@/infrastructure/media/file-storage.adapter";

export {
  addToCatalog,
  listLibraryFiles,
  findMediaUsages,
  resetHeroSettings,
  updateCatalogMeta,
  removeFromCatalog,
  getFullMediaState,
  getUploadDir,
} from "@/infrastructure/media/media.repository";
