import { MEDIA } from "@/lib/media";
import {
  DEFAULT_SETTING_KEYS,
  AXIS_SLUGS,
  type GalleryItem,
  type MediaCatalogEntry,
} from "@/domain/media";

export const HERO_DEFAULTS: Record<string, string> = {
  hero_image: MEDIA.hero.image,
  hero_image_mobile: MEDIA.hero.imageMobile,
  hero_poster: MEDIA.hero.poster,
  hero_video: "",
  hero_image_alt: "Familles militaires — CFM ASBL",
  mission_image: MEDIA.mission,
  mission_image_alt: "Mission CFM — rassemblement des familles",
};

export const DEFAULT_FALLBACKS: Record<string, string> = {
  default_news_cover: MEDIA.news.default,
  default_live_thumb: MEDIA.live.defaultThumb,
  default_testimonial_1: MEDIA.testimonials.default,
  default_testimonial_2: "/media/temoignages/portrait-02.svg",
  default_testimonial_anonymous: MEDIA.testimonials.anonymous,
  press_kit_url: "/media/presse/dossier-presse.pdf",
  og_image: MEDIA.hero.image,
  about_founder: MEDIA.about.founder,
  about_team: MEDIA.about.team,
  favicon_url: "/icon.svg",
};

export function defaultFikinGallery(): GalleryItem[] {
  return MEDIA.fikinGallery.map((item, i) => ({
    src: item.src,
    alt: item.alt,
    sort: i + 1,
  }));
}

export function defaultAxisImages(): Record<string, string> {
  return { ...MEDIA.axes };
}

export function parseJsonSetting<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function parseGallery(settings: Record<string, string>): GalleryItem[] {
  return parseJsonSetting(settings.fikin_gallery, defaultFikinGallery()).sort(
    (a, b) => a.sort - b.sort
  );
}

export function parseAxisImages(settings: Record<string, string>): Record<string, string> {
  const stored = parseJsonSetting<Record<string, string>>(settings.axis_images, {});
  const defaults = defaultAxisImages();
  const out: Record<string, string> = { ...defaults };
  for (const slug of AXIS_SLUGS) {
    if (stored[slug]) out[slug] = stored[slug];
  }
  return out;
}

export function parseCatalog(settings: Record<string, string>): MediaCatalogEntry[] {
  return parseJsonSetting<MediaCatalogEntry[]>(settings.media_catalog, []);
}

export function settingOrDefault(
  settings: Record<string, string>,
  key: string,
  fallback: string
): string {
  const v = settings[key];
  return v && v.length > 0 ? v : fallback;
}

export { HERO_SETTING_KEYS } from "@/domain/media";
export { DEFAULT_SETTING_KEYS };
