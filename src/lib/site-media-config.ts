/** @deprecated Utiliser @/domain/media et @/infrastructure/media/site-media.parsers */
export type {
  GalleryItem,
  MediaCatalogEntry,
  MissingMediaItem,
  MediaHeroState,
  MediaDefaultsState,
  FullMediaState,
  MediaAssignTarget,
} from "@/domain/media";

export {
  HERO_SETTING_KEYS,
  DEFAULT_SETTING_KEYS,
  DEFAULT_SETTING_KEY_VALUES,
  ASSIGNABLE_MEDIA_KEYS,
  AXIS_SLUGS,
  isAssignableMediaKey,
} from "@/domain/media";

export {
  HERO_DEFAULTS,
  DEFAULT_FALLBACKS,
  defaultFikinGallery,
  defaultAxisImages,
  parseJsonSetting,
  parseGallery,
  parseAxisImages,
  parseCatalog,
  settingOrDefault,
} from "@/infrastructure/media/site-media.parsers";
