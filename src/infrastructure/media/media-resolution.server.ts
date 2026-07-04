import "server-only";
import { getStore } from "@/infrastructure/persistence/store-access";
import { MEDIA, type SiteMediaSettings } from "@/lib/media";
import { pngToSvgFallback } from "@/infrastructure/media/media-resolver";
import {
  DEFAULT_FALLBACKS,
  DEFAULT_SETTING_KEYS,
  parseAxisImages,
  parseGallery,
  settingOrDefault,
} from "@/infrastructure/media/site-media.parsers";
import { publicFileExists } from "@/infrastructure/media/file-storage.adapter";

function pick(publicPath: string, svgFallback: string): string {
  return publicFileExists(publicPath) ? publicPath : svgFallback;
}

function getSettings(): Record<string, string> {
  return getStore().site_settings;
}

export function getSiteMedia(): SiteMediaSettings & {
  heroImageMobile: string;
  heroImageAlt: string;
  missionImageAlt: string;
} {
  const settings = getSettings();
  const heroPng = settingOrDefault(settings, "hero_image", MEDIA.hero.image);
  const heroMobile = settingOrDefault(settings, "hero_image_mobile", MEDIA.hero.imageMobile);
  const missionPng = settingOrDefault(settings, "mission_image", MEDIA.mission);

  return {
    heroImage: pick(heroPng, pngToSvgFallback(heroPng)),
    heroImageMobile: pick(heroMobile, pngToSvgFallback(heroMobile)),
    heroVideo:
      settings.hero_video && settings.hero_video.length > 0
        ? settings.hero_video
        : MEDIA.hero.video,
    heroPoster: pick(
      settingOrDefault(settings, "hero_poster", heroPng),
      pngToSvgFallback(heroPng)
    ),
    heroImageAlt: settingOrDefault(settings, "hero_image_alt", "Familles militaires — CFM ASBL"),
    missionImage: pick(missionPng, pngToSvgFallback(missionPng)),
    missionImageAlt: settingOrDefault(settings, "mission_image_alt", "Mission CFM"),
  };
}

export function resolveMediaPath(publicPath: string): string {
  return pick(publicPath, pngToSvgFallback(publicPath));
}

export function getResolvedGallery() {
  const settings = getSettings();
  const gallery = settings.fikin_gallery
    ? parseGallery(settings)
    : MEDIA.fikinGallery.map((item, i) => ({ ...item, sort: i + 1 }));

  return gallery.map((item) => ({
    src: resolveMediaPath(item.src),
    alt: item.alt,
  }));
}

export function getResolvedAxisImage(slug: string): string {
  const axes = parseAxisImages(getSettings());
  const path = axes[slug] || (MEDIA.axes as Record<string, string>)[slug] || MEDIA.mission;
  return resolveMediaPath(path);
}

export function getResolvedAboutMedia() {
  const settings = getSettings();
  return {
    founder: resolveMediaPath(
      settingOrDefault(settings, DEFAULT_SETTING_KEYS.aboutFounder, MEDIA.about.founder)
    ),
    team: resolveMediaPath(
      settingOrDefault(settings, DEFAULT_SETTING_KEYS.aboutTeam, MEDIA.about.team)
    ),
  };
}

export function getResolvedLiveThumb(thumbnail?: string | null): string {
  const settings = getSettings();
  const fallback = settingOrDefault(
    settings,
    DEFAULT_SETTING_KEYS.live,
    MEDIA.live.defaultThumb
  );
  return resolveMediaPath(thumbnail || fallback);
}

export function getResolvedNewsCover(coverImage?: string | null): string {
  const settings = getSettings();
  const fallback = settingOrDefault(settings, DEFAULT_SETTING_KEYS.news, MEDIA.news.default);
  return resolveMediaPath(coverImage || fallback);
}

export function getResolvedTestimonialPhoto(
  anonymous: boolean,
  index: number,
  photo?: string | null
): string {
  if (photo) return resolveMediaPath(photo);
  const settings = getSettings();
  if (anonymous) {
    return resolveMediaPath(
      settingOrDefault(
        settings,
        DEFAULT_SETTING_KEYS.testimonialAnonymous,
        MEDIA.testimonials.anonymous
      )
    );
  }
  const key =
    index % 2 === 0
      ? DEFAULT_SETTING_KEYS.testimonial1
      : DEFAULT_SETTING_KEYS.testimonial2;
  const fallback =
    index % 2 === 0
      ? MEDIA.testimonials.default
      : "/media/temoignages/portrait-02.svg";
  return resolveMediaPath(settingOrDefault(settings, key, fallback));
}

export function getPressKitPath(): string {
  const settings = getSettings();
  return settingOrDefault(
    settings,
    DEFAULT_SETTING_KEYS.pressKit,
    DEFAULT_FALLBACKS.press_kit_url
  );
}

export function getOgImagePath(): string {
  const settings = getSettings();
  return resolveMediaPath(
    settingOrDefault(settings, DEFAULT_SETTING_KEYS.ogImage, DEFAULT_FALLBACKS.og_image)
  );
}

export function getFaviconPath(): string {
  const settings = getSettings();
  return settingOrDefault(settings, DEFAULT_SETTING_KEYS.favicon, "/icon.svg");
}

/** Hero image for /actions — uses FIKIN gallery item 4 or first */
export function getActionsHeroImage(): string {
  const gallery = getResolvedGallery();
  const item = gallery[3] ?? gallery[0];
  return item?.src ?? resolveMediaPath(MEDIA.mission);
}
