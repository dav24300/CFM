/** @deprecated Utiliser @/infrastructure/cache/media-cache pour les lectures publiques */
export {
  getSiteMediaCached as getSiteMedia,
  getResolvedGalleryCached as getResolvedGallery,
  getResolvedAboutMediaCached as getResolvedAboutMedia,
  getPressKitPathCached as getPressKitPath,
  getOgImagePathCached as getOgImagePath,
  getFaviconPathCached as getFaviconPath,
  getActionsHeroImageCached as getActionsHeroImage,
  getResolvedAxisImageCached as getResolvedAxisImage,
  getResolvedLiveThumbCached as getResolvedLiveThumb,
  getResolvedNewsCoverCached as getResolvedNewsCover,
  getResolvedTestimonialPhotoCached as getResolvedTestimonialPhoto,
} from "@/infrastructure/cache/media-cache";

export { resolveMediaPath } from "@/infrastructure/media/media-resolution.server";
