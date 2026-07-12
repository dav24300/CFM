import { describe, expect, it, vi } from "vitest";
import { UploadError } from "@/domain/media/upload-errors";
import { jsonUnauthorized } from "@/infrastructure/http/api-response";

const mocked = vi.hoisted(() => ({
  getAdminAccess: vi.fn(),
  getMediaState: vi.fn(),
  getMissingMedia: vi.fn(),
  assignMedia: vi.fn(),
  deleteLibraryAsset: vi.fn(),
  uploadMediaFile: vi.fn(),
}));

vi.mock("@/lib/admin-access", () => ({
  getAdminAccess: mocked.getAdminAccess,
}));

vi.mock("@/lib/admin-audit", () => ({
  logAdminAction: vi.fn(),
}));

vi.mock("@/application/services/media.service", () => ({
  getMediaState: mocked.getMediaState,
  getMissingMedia: mocked.getMissingMedia,
  assignMedia: mocked.assignMedia,
  deleteLibraryAsset: mocked.deleteLibraryAsset,
  uploadMediaFile: mocked.uploadMediaFile,
  getMediaLibrary: vi.fn(() => ({ items: [] })),
  updateLibraryMeta: vi.fn(),
  cleanupOrphanUploads: vi.fn(() => ({ removed: [], count: 0 })),
}));

import { GET as getMedia, POST as postMedia } from "@/app/api/admin/media/route";
import { GET as getMissing } from "@/app/api/admin/media/missing/route";
import { PATCH as assignPatch } from "@/app/api/admin/media/assign/route";
import { DELETE as deleteLibrary } from "@/app/api/admin/media/library/route";

describe("/api/admin/media routes", () => {
  it("GET /api/admin/media denies unauthorized", async () => {
    mocked.getAdminAccess.mockResolvedValueOnce(null);
    const res = await getMedia();
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/media returns state for admin", async () => {
    mocked.getAdminAccess.mockResolvedValueOnce("admin");
    mocked.getMediaState.mockReturnValueOnce({
      hero: { hero_image: "/media/hero.svg" },
      defaults: {},
    });
    const res = await getMedia();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.hero.hero_image).toBe("/media/hero.svg");
  });

  it("GET /api/admin/media/missing returns scan", async () => {
    mocked.getAdminAccess.mockResolvedValueOnce("admin");
    mocked.getMissingMedia.mockReturnValueOnce({
      missing: [{ type: "news", id: 1, title: "A", field: "cover_image" }],
      count: 1,
    });
    const res = await getMissing();
    const body = await res.json();
    expect(body.count).toBe(1);
  });

  it("PATCH /api/admin/media/assign assigns media", async () => {
    mocked.getAdminAccess.mockResolvedValueOnce("admin");
    mocked.assignMedia.mockReturnValueOnce(true);
    const req = new Request("http://localhost/api/admin/media/assign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "news",
        id: 1,
        field: "cover_image",
        path: "/media/uploads/x.webp",
      }),
    }) as any;
    const res = await assignPatch(req);
    expect(res.status).toBe(200);
    expect(mocked.assignMedia).toHaveBeenCalled();
  });

  it("DELETE /api/admin/media/library blocks when in use", async () => {
    mocked.getAdminAccess.mockResolvedValueOnce("admin");
    mocked.deleteLibraryAsset.mockReturnValueOnce({
      blocked: true,
      usages: ["news:1 Titre"],
    });
    const req = new Request("http://localhost/api/admin/media/library?path=/x") as any;
    const res = await deleteLibrary(req);
    expect(res.status).toBe(409);
  });

  it("POST /api/admin/media returns structured upload success", async () => {
    mocked.getAdminAccess.mockResolvedValueOnce("admin");
    mocked.uploadMediaFile.mockResolvedValueOnce({
      path: "/media/uploads/x.webp",
      previewUrl: "/media/uploads/x.webp",
      published: true,
      warnings: ["HEIC converti en WebP pour le web."],
      settingKey: "hero_image",
    });
    const form = new FormData();
    form.append("file", new File(["x"], "photo.heic", { type: "image/heic" }));
    form.append("settingKey", "hero_image");
    const req = new Request("http://localhost/api/admin/media", {
      method: "POST",
      body: form,
    }) as any;
    const res = await postMedia(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.path).toBe("/media/uploads/x.webp");
    expect(body.published).toBe(true);
    expect(body.warnings).toHaveLength(1);
  });

  it("POST /api/admin/media returns structured upload error", async () => {
    mocked.getAdminAccess.mockResolvedValueOnce("admin");
    mocked.uploadMediaFile.mockRejectedValueOnce(
      new UploadError(
        "MIME_REJECTED",
        "Type de fichier non autorisé.",
        "Formats acceptés : JPG, PNG, WebP.",
        400
      )
    );
    const form = new FormData();
    form.append("file", new File(["x"], "bad.exe", { type: "application/octet-stream" }));
    const req = new Request("http://localhost/api/admin/media", {
      method: "POST",
      body: form,
    }) as any;
    const res = await postMedia(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.code).toBe("MIME_REJECTED");
    expect(body.hint).toContain("JPG");
  });
});

describe("file-storage validation", () => {
  it("rejects disallowed mime types", async () => {
    const { validateUploadFile } = await import(
      "@/infrastructure/media/file-storage.adapter"
    );
    const file = { type: "application/zip", size: 100 } as File;
    const result = validateUploadFile(file);
    expect(result.ok).toBe(false);
  });

  it("accepts jpeg uploads under size limit", async () => {
    const { validateUploadFile } = await import(
      "@/infrastructure/media/file-storage.adapter"
    );
    const file = { type: "image/jpeg", size: 1024 } as File;
    const result = validateUploadFile(file);
    expect(result.ok).toBe(true);
  });
});
