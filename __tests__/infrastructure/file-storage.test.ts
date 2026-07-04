import { describe, expect, it } from "vitest";
import {
  ALLOWED_MIME,
  MAX_IMAGE_SIZE,
  MAX_PDF_SIZE,
  MAX_VIDEO_SIZE,
  MAX_UPLOAD_SIZE,
  resolveMimeType,
  validateUploadFile,
} from "@/infrastructure/media/file-storage.adapter";

describe("media file-storage constants", () => {
  it("allows common image and document types", () => {
    expect(ALLOWED_MIME.has("image/jpeg")).toBe(true);
    expect(ALLOWED_MIME.has("image/png")).toBe(true);
    expect(ALLOWED_MIME.has("image/heic")).toBe(true);
    expect(ALLOWED_MIME.has("image/heif")).toBe(true);
    expect(ALLOWED_MIME.has("application/pdf")).toBe(true);
    expect(ALLOWED_MIME.has("video/mp4")).toBe(true);
  });

  it("uses differentiated size limits", () => {
    expect(MAX_UPLOAD_SIZE).toBe(MAX_IMAGE_SIZE);
    expect(MAX_IMAGE_SIZE).toBe(20 * 1024 * 1024);
    expect(MAX_PDF_SIZE).toBe(20 * 1024 * 1024);
    expect(MAX_VIDEO_SIZE).toBe(50 * 1024 * 1024);
  });
});

describe("resolveMimeType", () => {
  it("falls back to extension when file.type is empty", () => {
    const file = { type: "", name: "photo.heic", size: 100 } as File;
    expect(resolveMimeType(file)).toBe("image/heic");
  });

  it("prefers valid browser mime", () => {
    const file = { type: "image/jpeg", name: "x.bin", size: 100 } as File;
    expect(resolveMimeType(file)).toBe("image/jpeg");
  });
});

describe("validateUploadFile", () => {
  it("rejects disallowed mime types", () => {
    const file = { type: "application/zip", name: "x.zip", size: 100 } as File;
    const result = validateUploadFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MIME_REJECTED");
    }
  });

  it("accepts jpeg uploads under size limit", () => {
    const file = { type: "image/jpeg", name: "a.jpg", size: 1024 } as File;
    expect(validateUploadFile(file).ok).toBe(true);
  });

  it("accepts HEIC via extension fallback", () => {
    const file = { type: "", name: "iphone.heic", size: 1024 } as File;
    const result = validateUploadFile(file);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mime).toBe("image/heic");
  });

  it("rejects files over image limit", () => {
    const file = {
      type: "image/jpeg",
      name: "big.jpg",
      size: MAX_IMAGE_SIZE + 1,
    } as File;
    const result = validateUploadFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TOO_LARGE");
  });
});
