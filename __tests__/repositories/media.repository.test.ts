import { beforeEach, describe, expect, it, vi } from "vitest";

let mockStore: Record<string, unknown>;

vi.mock("@/infrastructure/persistence/store-access", () => ({
  getStoreAsync: vi.fn(() => Promise.resolve(mockStore)),
  updateStoreAsync: vi.fn((mutator: (store: typeof mockStore) => void) => {
    mutator(mockStore);
    return Promise.resolve(mockStore);
  }),
}));

vi.mock("@/infrastructure/media/file-storage.adapter", () => ({
  deletePublicMediaFile: vi.fn(() => true),
  getUploadDir: vi.fn(() => "/tmp/uploads"),
  listOrphanUploadFiles: vi.fn(() => []),
}));

vi.mock("@/infrastructure/repositories/content.repository", () => ({
  adminUpdateContent: vi.fn(() => true),
  listAllNews: vi.fn(() => Promise.resolve(mockStore.news ?? [])),
  listAllCampaigns: vi.fn(() => Promise.resolve(mockStore.campaigns ?? [])),
  listAllTestimonials: vi.fn(() => Promise.resolve(mockStore.testimonials ?? [])),
  listAllStudies: vi.fn(() => Promise.resolve(mockStore.studies ?? [])),
  listAllPressReleases: vi.fn(() => Promise.resolve(mockStore.press_releases ?? [])),
}));

vi.mock("@/infrastructure/repositories/live.repository", () => ({
  updateLiveEventMedia: vi.fn(() => ({ id: 1 })),
  getLiveEvents: vi.fn(() => Promise.resolve(mockStore.live_events ?? [])),
}));

vi.mock("@/infrastructure/repositories/partners.repository", () => ({
  adminUpdatePartner: vi.fn(() => true),
  getAllPartners: vi.fn(() => Promise.resolve(mockStore.partners ?? [])),
}));

import { adminUpdateContent } from "@/infrastructure/repositories/content.repository";
import { updateLiveEventMedia } from "@/infrastructure/repositories/live.repository";
import {
  findMediaUsages,
  scanMissingMedia,
  assignMediaToEntity,
} from "@/infrastructure/media/media.repository";

describe("media.repository", () => {
  beforeEach(() => {
    mockStore = {
      site_settings: {
        hero_image: "/media/uploads/hero.webp",
        media_catalog: "[]",
      },
      news: [{ id: 1, title: "Actu", cover_image: null }],
      campaigns: [],
      testimonials: [],
      studies: [],
      press_releases: [],
      live_events: [{ id: 2, title: "Live", thumbnail: null }],
      partners: [{ id: 3, name: "Partenaire", logo_url: null }],
    };
    vi.clearAllMocks();
  });

  it("findMediaUsages detects site_settings and entity references", async () => {
    mockStore.news = [{ id: 1, title: "Actu", cover_image: "/media/uploads/hero.webp" }];
    const usages = await findMediaUsages("/media/uploads/hero.webp");
    expect(usages.some((u) => u.startsWith("site_settings"))).toBe(true);
    expect(usages.some((u) => u.startsWith("news:"))).toBe(true);
  });

  it("scanMissingMedia lists entities without visuals", async () => {
    const missing = await scanMissingMedia();
    expect(missing.length).toBeGreaterThanOrEqual(3);
    expect(missing.some((m) => m.type === "news" && m.field === "cover_image")).toBe(true);
    expect(missing.some((m) => m.type === "live_events")).toBe(true);
    expect(missing.some((m) => m.type === "partners")).toBe(true);
  });

  it("assignMediaToEntity delegates to content repository", async () => {
    const ok = await assignMediaToEntity({
      type: "news",
      id: 1,
      field: "cover_image",
      path: "/media/uploads/cover.webp",
    });
    expect(ok).toBe(true);
    expect(adminUpdateContent).toHaveBeenCalledWith("news", 1, {
      cover_image: "/media/uploads/cover.webp",
    });
  });

  it("assignMediaToEntity delegates live thumbnail update", async () => {
    await assignMediaToEntity({
      type: "live_events",
      id: 2,
      field: "thumbnail",
      path: "/media/uploads/thumb.webp",
    });
    expect(updateLiveEventMedia).toHaveBeenCalledWith(2, {
      thumbnail: "/media/uploads/thumb.webp",
    });
  });
});
