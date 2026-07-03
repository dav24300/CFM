import "server-only";
import fs from "fs";
import path from "path";
import { getStore } from "@/lib/store";
import { MEDIA, type SiteMediaSettings } from "@/lib/media";
import { pngToSvgFallback } from "@/lib/infra/media-resolver";

function pick(publicPath: string, svgFallback: string): string {
  const full = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  return fs.existsSync(full) ? publicPath : svgFallback;
}

export function getSiteMedia(): SiteMediaSettings {
  const settings = getStore().site_settings;
  const heroPng = settings.hero_image || MEDIA.hero.image;
  const missionPng = settings.mission_image || MEDIA.mission;

  return {
    heroImage: pick(heroPng, pngToSvgFallback(heroPng)),
    heroVideo:
      settings.hero_video && settings.hero_video.length > 0
        ? settings.hero_video
        : MEDIA.hero.video,
    heroPoster: pick(settings.hero_poster || heroPng, pngToSvgFallback(heroPng)),
    missionImage: pick(missionPng, pngToSvgFallback(missionPng)),
  };
}

export function resolveMediaPath(publicPath: string): string {
  return pick(publicPath, pngToSvgFallback(publicPath));
}

export function getResolvedGallery() {
  return MEDIA.fikinGallery.map((item) => ({
    ...item,
    src: resolveMediaPath(item.src),
  }));
}

export function getResolvedAboutMedia() {
  return {
    founder: resolveMediaPath(MEDIA.about.founder),
    team: MEDIA.about.team,
  };
}

export function getResolvedLiveThumb(thumbnail?: string | null): string {
  const preferred = thumbnail || MEDIA.live.defaultThumb;
  return resolveMediaPath(preferred);
}

export function getResolvedNewsCover(coverImage?: string | null): string {
  const preferred = coverImage || MEDIA.news.default;
  return resolveMediaPath(preferred);
}
