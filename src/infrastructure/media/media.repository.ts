import { getStore, updateStore } from "@/infrastructure/persistence/store-access";
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
import { adminUpdateContent } from "@/infrastructure/repositories/content.repository";
import { updateLiveEventMedia } from "@/infrastructure/repositories/live.repository";
import { adminUpdatePartner } from "@/infrastructure/repositories/partners.repository";

function readSettings(): Record<string, string> {
  return getStore().site_settings;
}

export function setSiteSetting(key: string, value: string): void {
  updateStore((store) => {
    store.site_settings[key] = value;
  });
}

export function patchSiteSettings(patch: Record<string, string>): void {
  updateStore((store) => {
    for (const [key, val] of Object.entries(patch)) {
      if (typeof val === "string") store.site_settings[key] = val;
    }
  });
}

export function patchHeroSettings(hero: Record<string, string>): void {
  const patch: Record<string, string> = {};
  for (const key of HERO_SETTING_KEYS) {
    if (typeof hero[key] === "string") patch[key] = hero[key];
  }
  patchSiteSettings(patch);
}

export function patchDefaultSettings(defaults: Record<string, string>): void {
  patchSiteSettings(defaults);
}

export function patchAssignableSettings(body: Record<string, unknown>): void {
  const patch: Record<string, string> = {};
  for (const key of ASSIGNABLE_MEDIA_KEYS) {
    if (typeof body[key] === "string") patch[key] = body[key];
  }
  patchSiteSettings(patch);
}

export function resetHeroSettings(): void {
  updateStore((store) => {
    for (const [key, val] of Object.entries(HERO_DEFAULTS)) {
      store.site_settings[key] = val;
    }
  });
}

export function addToCatalog(entry: MediaCatalogEntry): void {
  updateStore((store) => {
    const catalog = parseCatalog(store.site_settings);
    const filtered = catalog.filter((c) => c.path !== entry.path);
    filtered.unshift({
      ...entry,
      uploaded_at: entry.uploaded_at || new Date().toISOString(),
    });
    store.site_settings.media_catalog = JSON.stringify(filtered.slice(0, 500));
  });
}

export function updateCatalogMeta(assetPath: string, patch: Partial<MediaCatalogEntry>): void {
  updateStore((store) => {
    const catalog = parseCatalog(store.site_settings);
    const idx = catalog.findIndex((c) => c.path === assetPath);
    if (idx >= 0) {
      catalog[idx] = { ...catalog[idx], ...patch };
    } else {
      catalog.unshift({ path: assetPath, ...patch, uploaded_at: new Date().toISOString() });
    }
    store.site_settings.media_catalog = JSON.stringify(catalog);
  });
}

export function removeFromCatalog(assetPath: string): void {
  updateStore((store) => {
    const catalog = parseCatalog(store.site_settings).filter((c) => c.path !== assetPath);
    store.site_settings.media_catalog = JSON.stringify(catalog);
  });
}

export function listLibraryFiles(): MediaCatalogEntry[] {
  const settings = readSettings();
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

export function findMediaUsages(targetPath: string): string[] {
  const store = getStore();
  const usages: string[] = [];

  for (const [key, val] of Object.entries(store.site_settings)) {
    if (val === targetPath) usages.push(`site_settings.${key}`);
  }

  for (const n of store.news) {
    if (n.cover_image === targetPath) usages.push(`news:${n.id} ${n.title}`);
  }
  for (const c of store.campaigns) {
    if (c.image_url === targetPath) usages.push(`campaign:${c.id} ${c.title}`);
  }
  for (const t of store.testimonials) {
    if (t.photo === targetPath) usages.push(`testimonial:${t.id}`);
  }
  for (const ev of store.live_events || []) {
    if (ev.thumbnail === targetPath) usages.push(`live:${ev.id} ${ev.title}`);
  }
  for (const p of store.partners) {
    if (p.logo_url === targetPath) usages.push(`partner:${p.id} ${p.name}`);
  }

  return usages;
}

export function getFullMediaState(): FullMediaState {
  const settings = readSettings();
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

export function getCollectionsState(): {
  fikin_gallery: GalleryItem[];
  axis_images: Record<string, string>;
} {
  const settings = readSettings();
  const fikin = settings.fikin_gallery ? parseGallery(settings) : defaultFikinGallery();
  const axes = settings.axis_images ? parseAxisImages(settings) : defaultAxisImages();
  return { fikin_gallery: fikin, axis_images: axes };
}

export function replaceCollections(body: {
  fikin_gallery?: GalleryItem[];
  axis_images?: Record<string, string>;
}): void {
  updateStore((store) => {
    if (Array.isArray(body.fikin_gallery)) {
      const items = body.fikin_gallery.map((item, i) => ({
        src: item.src,
        alt: item.alt || "",
        sort: item.sort ?? i + 1,
      }));
      store.site_settings.fikin_gallery = JSON.stringify(items);
    }
    if (body.axis_images && typeof body.axis_images === "object") {
      store.site_settings.axis_images = JSON.stringify(body.axis_images);
    }
  });
}

export function patchCollectionItem(body: {
  type?: "fikin" | "axis";
  item?: GalleryItem;
  slug?: string;
  src?: string;
}): void {
  updateStore((store) => {
    if (body.type === "fikin" && body.item) {
      const gallery = parseGallery(store.site_settings);
      const idx = gallery.findIndex((g) => g.sort === body.item!.sort);
      if (idx >= 0) gallery[idx] = body.item;
      else gallery.push(body.item);
      store.site_settings.fikin_gallery = JSON.stringify(
        gallery.sort((a, b) => a.sort - b.sort)
      );
    }
    if (body.type === "axis" && body.slug && body.src) {
      const axes = parseAxisImages(store.site_settings);
      axes[body.slug] = body.src;
      store.site_settings.axis_images = JSON.stringify(axes);
    }
  });
}

export function deleteFikinGalleryItem(sort: number): void {
  updateStore((store) => {
    const gallery = parseGallery(store.site_settings).filter((g) => g.sort !== sort);
    store.site_settings.fikin_gallery = JSON.stringify(gallery);
  });
}

export function scanMissingMedia(): MissingMediaItem[] {
  const store = getStore();
  const missing: MissingMediaItem[] = [];

  for (const n of store.news) {
    if (!n.cover_image) {
      missing.push({ type: "news", id: n.id, title: n.title, field: "cover_image" });
    }
  }
  for (const c of store.campaigns) {
    if (!c.image_url) {
      missing.push({ type: "campaigns", id: c.id, title: c.title, field: "image_url" });
    }
  }
  for (const t of store.testimonials) {
    if (!t.photo) {
      missing.push({
        type: "testimonials",
        id: t.id,
        title: t.author || "Témoignage",
        field: "photo",
      });
    }
  }
  for (const s of store.studies) {
    if (!s.file_url) {
      missing.push({ type: "studies", id: s.id, title: s.title, field: "file_url" });
    }
  }
  for (const pr of store.press_releases) {
    if (!pr.file_url) {
      missing.push({ type: "press_releases", id: pr.id, title: pr.title, field: "file_url" });
    }
  }
  for (const ev of store.live_events || []) {
    if (!ev.thumbnail) {
      missing.push({ type: "live_events", id: ev.id, title: ev.title, field: "thumbnail" });
    }
  }
  for (const p of store.partners) {
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

export function assignMediaToEntity(params: {
  type: MediaAssignTarget;
  id: number;
  field: string;
  path: string;
}): boolean {
  const { type, id, field, path } = params;

  if (type === "live_events") {
    return Boolean(updateLiveEventMedia(id, { thumbnail: path }));
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
    if (findMediaUsages(publicPath).length > 0) continue;
    await deletePublicMediaFile(publicPath);
    removeFromCatalog(publicPath);
    removed.push(publicPath);
  }
  return removed;
}

export { getUploadDir };
