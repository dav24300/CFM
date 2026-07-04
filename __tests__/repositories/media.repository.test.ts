import { beforeEach, describe, expect, it, vi } from "vitest";

let mockStore: Record<string, unknown>;

vi.mock("@/infrastructure/persistence/store-access", () => ({
  getStore: vi.fn(() => mockStore),
  updateStore: vi.fn((mutator: (store: typeof mockStore) => void) => {
    mutator(mockStore);
    return mockStore;
  }),
}));

vi.mock("@/infrastructure/media/file-storage.adapter", () => ({
  deletePublicMediaFile: vi.fn(() => true),
  getUploadDir: vi.fn(() => "/tmp/uploads"),
  listOrphanUploadFiles: vi.fn(() => []),
}));

vi.mock("@/infrastructure/repositories/content.repository", () => ({
  adminUpdateContent: vi.fn(() => true),
}));

vi.mock("@/infrastructure/repositories/live.repository", () => ({
  updateLiveEventMedia: vi.fn(() => ({ id: 1 })),
}));

vi.mock("@/infrastructure/repositories/partners.repository", () => ({
  adminUpdatePartner: vi.fn(() => true),
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

  it("findMediaUsages detects site_settings and entity references", () => {
    mockStore.news = [{ id: 1, title: "Actu", cover_image: "/media/uploads/hero.webp" }];
    const usages = findMediaUsages("/media/uploads/hero.webp");
    expect(usages.some((u) => u.startsWith("site_settings"))).toBe(true);
    expect(usages.some((u) => u.startsWith("news:"))).toBe(true);
  });

  it("scanMissingMedia lists entities without visuals", () => {
    const missing = scanMissingMedia();
    expect(missing.length).toBeGreaterThanOrEqual(3);
    expect(missing.some((m) => m.type === "news" && m.field === "cover_image")).toBe(true);
    expect(missing.some((m) => m.type === "live_events")).toBe(true);
    expect(missing.some((m) => m.type === "partners")).toBe(true);
  });

  it("assignMediaToEntity delegates to content repository", () => {
    const ok = assignMediaToEntity({
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

  it("assignMediaToEntity delegates live thumbnail update", () => {
    assignMediaToEntity({
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
