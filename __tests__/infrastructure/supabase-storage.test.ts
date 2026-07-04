import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isSupabaseStorageEnabled,
  toObjectPath,
  toPublicUrl,
  publicPathToObjectPath,
  SUPABASE_MEDIA_BUCKET,
} from "@/infrastructure/media/supabase-storage.adapter";

describe("supabase storage helpers", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  });

  afterEach(() => {
    process.env = env;
  });

  it("detects when Supabase storage is configured", () => {
    expect(isSupabaseStorageEnabled()).toBe(true);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(isSupabaseStorageEnabled()).toBe(false);
  });

  it("builds object paths", () => {
    expect(toObjectPath("file.webp")).toBe("uploads/file.webp");
    expect(toObjectPath("doc.pdf", "media/presse")).toBe("presse/doc.pdf");
  });

  it("builds public URLs", () => {
    expect(toPublicUrl("uploads/x.webp")).toBe(
      `https://abc.supabase.co/storage/v1/object/public/${SUPABASE_MEDIA_BUCKET}/uploads/x.webp`
    );
  });

  it("parses public URL back to object path", () => {
    const url = toPublicUrl("uploads/x.webp");
    expect(publicPathToObjectPath(url)).toBe("uploads/x.webp");
    expect(publicPathToObjectPath("/media/local.png")).toBeNull();
  });
});

describe("supabaseStorageAdapter.save", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => "" })
    );
  });

  afterEach(() => {
    process.env = env;
    vi.unstubAllGlobals();
  });

  it("uploads via Supabase Storage API", async () => {
    const { supabaseStorageAdapter } = await import(
      "@/infrastructure/media/supabase-storage.adapter"
    );
    const result = await supabaseStorageAdapter.save(Buffer.from("x"), {
      safeName: "photo.webp",
      mime: "image/webp",
    });
    expect(result.publicPath).toContain("uploads/photo.webp");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/storage/v1/object/media-uploads/uploads/photo.webp"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
