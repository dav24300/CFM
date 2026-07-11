import {
  ASSIGNABLE_MEDIA_KEYS,
  HERO_SETTING_KEYS,
  type FullMediaState,
  type GalleryItem,
  type MediaCatalogEntry,
  type MissingMediaItem,
  type MediaAssignTarget,
} from "@/domain/media";
import {
  HERO_DEFAULTS,
  defaultAxisImages,
  defaultFikinGallery,
  parseAxisImages,
  parseCatalog,
  parseGallery,
} from "@/infrastructure/media/site-media.parsers";
import {
  getUploadDir,
  listOrphanUploadFiles,
  deletePublicMediaFile,
} from "@/infrastructure/media/file-storage.adapter";
import fs from "fs";
import path from "path";
import { invalidateMediaCache } from "@/infrastructure/cache/invalidate-media";
import * as settingsRepo from "@/infrastructure/repositories/settings.repository";
import {
  adminUpdateContent,
  listAllCampaigns,
  listAllNews,
  listAllPressReleases,
  listAllStudies,
  listAllTestimonials,
} from "@/infrastructure/repositories/content.repository";
import { getLiveEvents, updateLiveEventMedia } from "@/infrastructure/repositories/live.repository";
import { adminUpdatePartner, getAllPartners } from "@/infrastructure/repositories/partners.repository";

/**
 * Toutes les lectures/écritures site_settings passent par settings.repository
 * (dual-mode Store JSON / SQL ciblé) ; les lectures croisées contenu/live/
 * partenaires passent par les repositories propriétaires de ces agrégats.
 * Les read-modify-write (media_catalog, fikin_gallery, axis_images) utilisent
 * mutateSiteSetting — atomique en PG (SELECT ... FOR UPDATE) comme en JSON.
 */

/** Reconstruit un mini-objet settings pour réutiliser les parsers existants. */
function asSettings(key: string, raw: string | undefined): Record<string, string> {
  return raw === undefined ? {} : { [key]: raw };
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  await settingsRepo.patchSiteSettings({ [key]: value });
  invalidateMediaCache();
}

export async function patchSiteSettings(patch: Record<string, string>): Promise<void> {
  const filtered: Record<string, string> = {};
  for (const [key, val] of Object.entries(patch)) {
    if (typeof val === "string") filtered[key] = val;
  }
  await settingsRepo.patchSiteSettings(filtered);
  invalidateMediaCache();
}

export async function patchHeroSettings(hero: Record<string, string>): Promise<void> {
  const patch: Record<string, string> = {};
  for (const key of HERO_SETTING_KEYS) {
    if (typeof hero[key] === "string") patch[key] = hero[key];
  }
  await patchSiteSettings(patch);
}

export async function patchDefaultSettings(defaults: Record<string, string>): Promise<void> {
  await patchSiteSettings(defaults);
}

export async function patchAssignableSettings(body: Record<string, unknown>): Promise<void> {
  const patch: Record<string, string> = {};
  for (const key of ASSIGNABLE_MEDIA_KEYS) {
    if (typeof body[key] === "string") patch[key] = body[key];
  }
  await patchSiteSettings(patch);
}

export async function resetHeroSettings(): Promise<void> {
  await settingsRepo.patchSiteSettings({ ...HERO_DEFAULTS });
  invalidateMediaCache();
}

export async function addToCatalog(entry: MediaCatalogEntry): Promise<void> {
  await settingsRepo.mutateSiteSetting("media_catalog", (raw) => {
    const catalog = parseCatalog(asSettings("media_catalog", raw));
    const filtered = catalog.filter((c) => c.path !== entry.path);
    filtered.unshift({
      ...entry,
      uploaded_at: entry.uploaded_at || new Date().toISOString(),
    });
    return JSON.stringify(filtered.slice(0, 500));
  });
}

export async function updateCatalogMeta(
  assetPath: string,
  patch: Partial<MediaCatalogEntry>
): Promise<void> {
  await settingsRepo.mutateSiteSetting("media_catalog", (raw) => {
    const catalog = parseCatalog(asSettings("media_catalog", raw));
    const idx = catalog.findIndex((c) => c.path === assetPath);
    if (idx >= 0) {
      catalog[idx] = { ...catalog[idx], ...patch };
    } else {
      catalog.unshift({ path: assetPath, ...patch, uploaded_at: new Date().toISOString() });
    }
    return JSON.stringify(catalog);
  });
}

export async function removeFromCatalog(assetPath: string): Promise<void> {
  await settingsRepo.mutateSiteSetting("media_catalog", (raw) => {
    const catalog = parseCatalog(asSettings("media_catalog", raw)).filter(
      (c) => c.path !== assetPath
    );
    return JSON.stringify(catalog);
  });
}

export async function listLibraryFiles(): Promise<MediaCatalogEntry[]> {
  const settings = await settingsRepo.getSiteSettings();
  const catalog = parseCatalog(settings);
  const catalogPaths = new Set(catalog.map((c) => c.path));
  const fromDisk = listOrphanUploadFiles(catalogPaths).map((item) => ({
    path: item.path,
    uploaded_at: item.uploaded_at,
    category: "upload" as const,
  }));

  return [...catalog, ...fromDisk].sort((a, b) =>
    (b.uploaded_at || "").localeCompare(a.uploaded_at || "")
  );
}

/** Listes croisées contenu/live/partenaires, ordre id ASC (parité Store). */
async function listMediaBearingEntities() {
  const [news, campaigns, testimonials, studies, pressReleases, liveEvents, partners] =
    await Promise.all([
      listAllNews(),
      listAllCampaigns(),
      listAllTestimonials(),
      listAllStudies(),
      listAllPressReleases(),
      getLiveEvents(),
      getAllPartners(),
    ]);
  // getLiveEvents trie created_at DESC : re-inversé pour retrouver l'ordre
  // chronologique (≈ ordre d'insertion du Store).
  return {
    news,
    campaigns,
    testimonials,
    studies,
    pressReleases,
    liveEvents: [...liveEvents].reverse(),
    partners,
  };
}

export async function findMediaUsages(targetPath: string): Promise<string[]> {
  const settings = await settingsRepo.getSiteSettings();
  const usages: string[] = [];

  for (const [key, val] of Object.entries(settings)) {
    if (val === targetPath) usages.push(`site_settings.${key}`);
  }

  const { news, campaigns, testimonials, liveEvents, partners } =
    await listMediaBearingEntities();

  for (const n of news) {
    if (n.cover_image === targetPath) usages.push(`news:${n.id} ${n.title}`);
  }
  for (const c of campaigns) {
    if (c.image_url === targetPath) usages.push(`campaign:${c.id} ${c.title}`);
  }
  for (const t of testimonials) {
    if (t.photo === targetPath) usages.push(`testimonial:${t.id}`);
  }
  for (const ev of liveEvents) {
    if (ev.thumbnail === targetPath) usages.push(`live:${ev.id} ${ev.title}`);
  }
  for (const p of partners) {
    if (p.logo_url === targetPath) usages.push(`partner:${p.id} ${p.name}`);
  }

  return usages;
}

export async function getFullMediaState(): Promise<FullMediaState> {
  const settings = await settingsRepo.getSiteSettings();
  return {
    hero: {
      hero_image: settings.hero_image || "",
      hero_image_mobile: settings.hero_image_mobile || "",
      hero_poster: settings.hero_poster || "",
      hero_video: settings.hero_video || "",
      hero_image_alt: settings.hero_image_alt || "",
      mission_image: settings.mission_image || "",
      mission_image_alt: settings.mission_image_alt || "",
    },
    defaults: {
      default_news_cover: settings.default_news_cover || "",
      default_live_thumb: settings.default_live_thumb || "",
      default_testimonial_1: settings.default_testimonial_1 || "",
      default_testimonial_2: settings.default_testimonial_2 || "",
      default_testimonial_anonymous: settings.default_testimonial_anonymous || "",
      press_kit_url: settings.press_kit_url || "",
      og_image: settings.og_image || "",
      about_founder: settings.about_founder || "",
      about_team: settings.about_team || "",
      favicon_url: settings.favicon_url || "",
    },
    fikin_gallery: settings.fikin_gallery || "",
    axis_images: settings.axis_images || "",
    media_catalog: settings.media_catalog || "",
    hero_defaults: HERO_DEFAULTS,
  };
}

export async function getCollectionsState(): Promise<{
  fikin_gallery: GalleryItem[];
  axis_images: Record<string, string>;
}> {
  const settings = await settingsRepo.getSiteSettings();
  const fikin = settings.fikin_gallery ? parseGallery(settings) : defaultFikinGallery();
  const axes = settings.axis_images ? parseAxisImages(settings) : defaultAxisImages();
  return { fikin_gallery: fikin, axis_images: axes };
}

export async function replaceCollections(body: {
  fikin_gallery?: GalleryItem[];
  axis_images?: Record<string, string>;
}): Promise<void> {
  const patch: Record<string, string> = {};
  if (Array.isArray(body.fikin_gallery)) {
    const items = body.fikin_gallery.map((item, i) => ({
      src: item.src,
      alt: item.alt || "",
      sort: item.sort ?? i + 1,
    }));
    patch.fikin_gallery = JSON.stringify(items);
  }
  if (body.axis_images && typeof body.axis_images === "object") {
    patch.axis_images = JSON.stringify(body.axis_images);
  }
  await settingsRepo.patchSiteSettings(patch);
  invalidateMediaCache();
}

export async function patchCollectionItem(body: {
  type?: "fikin" | "axis";
  item?: GalleryItem;
  slug?: string;
  src?: string;
}): Promise<void> {
  if (body.type === "fikin" && body.item) {
    await settingsRepo.mutateSiteSetting("fikin_gallery", (raw) => {
      const gallery = parseGallery(asSettings("fikin_gallery", raw));
      const idx = gallery.findIndex((g) => g.sort === body.item!.sort);
      if (idx >= 0) gallery[idx] = body.item!;
      else gallery.push(body.item!);
      return JSON.stringify(gallery.sort((a, b) => a.sort - b.sort));
    });
  }
  if (body.type === "axis" && body.slug && body.src) {
    await settingsRepo.mutateSiteSetting("axis_images", (raw) => {
      const axes = parseAxisImages(asSettings("axis_images", raw));
      axes[body.slug!] = body.src!;
      return JSON.stringify(axes);
    });
  }
  invalidateMediaCache();
}

export async function deleteFikinGalleryItem(sort: number): Promise<void> {
  await settingsRepo.mutateSiteSetting("fikin_gallery", (raw) => {
    const gallery = parseGallery(asSettings("fikin_gallery", raw)).filter(
      (g) => g.sort !== sort
    );
    return JSON.stringify(gallery);
  });
  invalidateMediaCache();
}

export async function scanMissingMedia(): Promise<MissingMediaItem[]> {
  const { news, campaigns, testimonials, studies, pressReleases, liveEvents, partners } =
    await listMediaBearingEntities();
  const missing: MissingMediaItem[] = [];

  for (const n of news) {
    if (!n.cover_image) {
      missing.push({ type: "news", id: n.id, title: n.title, field: "cover_image" });
    }
  }
  for (const c of campaigns) {
    if (!c.image_url) {
      missing.push({ type: "campaigns", id: c.id, title: c.title, field: "image_url" });
    }
  }
  for (const t of testimonials) {
    if (!t.photo) {
      missing.push({
        type: "testimonials",
        id: t.id,
        title: t.author || "Témoignage",
        field: "photo",
      });
    }
  }
  for (const s of studies) {
    if (!s.file_url) {
      missing.push({ type: "studies", id: s.id, title: s.title, field: "file_url" });
    }
  }
  for (const pr of pressReleases) {
    if (!pr.file_url) {
      missing.push({ type: "press_releases", id: pr.id, title: pr.title, field: "file_url" });
    }
  }
  for (const ev of liveEvents) {
    if (!ev.thumbnail) {
      missing.push({ type: "live_events", id: ev.id, title: ev.title, field: "thumbnail" });
    }
  }
  for (const p of partners) {
    if (!p.logo_url) {
      missing.push({ type: "partners", id: p.id, title: p.name, field: "logo_url" });
    }
  }

  return missing;
}

const CONTENT_TABLES = new Set<MediaAssignTarget>([
  "news",
  "studies",
  "campaigns",
  "press_releases",
  "testimonials",
]);

export async function assignMediaToEntity(params: {
  type: MediaAssignTarget;
  id: number;
  field: string;
  path: string;
}): Promise<boolean> {
  const { type, id, field, path } = params;

  if (type === "live_events") {
    return Boolean(await updateLiveEventMedia(id, { thumbnail: path }));
  }

  if (type === "partners") {
    return adminUpdatePartner(id, { logo_url: path });
  }

  if (CONTENT_TABLES.has(type)) {
    return adminUpdateContent(type, id, { [field]: path });
  }

  return false;
}

export async function cleanupOrphanUploadFiles(): Promise<string[]> {
  const removed: string[] = [];
  const uploadDir = getUploadDir();
  if (!fs.existsSync(uploadDir)) return removed;

  for (const name of fs.readdirSync(uploadDir)) {
    const full = path.join(uploadDir, name);
    if (!fs.statSync(full).isFile()) continue;
    const publicPath = `/media/uploads/${name}`;
    if ((await findMediaUsages(publicPath)).length > 0) continue;
    await deletePublicMediaFile(publicPath);
    await removeFromCatalog(publicPath);
    removed.push(publicPath);
  }
  return removed;
}

export { getUploadDir };
