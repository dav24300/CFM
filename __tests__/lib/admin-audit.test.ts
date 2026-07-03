import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: fsMocks,
  existsSync: fsMocks.existsSync,
  mkdirSync: fsMocks.mkdirSync,
  appendFileSync: fsMocks.appendFileSync,
}));

describe("logAdminAction", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    fsMocks.existsSync.mockReset();
    fsMocks.mkdirSync.mockReset();
    fsMocks.appendFileSync.mockReset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("logs to stdout on serverless without touching the filesystem", async () => {
    process.env.CFM_SERVERLESS = "true";
    delete process.env.DATABASE_URL;

    const { logAdminAction } = await import("@/lib/admin-audit");
    await logAdminAction({
      actorType: "admin",
      endpoint: "/api/admin/login",
      action: "login",
      status: "success",
    });

    expect(fsMocks.appendFileSync).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[CFM admin-audit]",
      expect.stringContaining('"action":"login"')
    );
  });

  it("does not throw when file audit fails on a persistent runtime", async () => {
    delete process.env.CFM_SERVERLESS;
    delete process.env.NETLIFY;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.DATABASE_URL;

    fsMocks.existsSync.mockReturnValue(true);
    fsMocks.appendFileSync.mockImplementation(() => {
      throw new Error("EROFS: read-only file system");
    });

    const { logAdminAction } = await import("@/lib/admin-audit");
    await expect(
      logAdminAction({
        actorType: "unknown",
        endpoint: "/api/admin/login",
        action: "login",
        status: "denied",
      })
    ).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[CFM admin-audit]",
      expect.stringContaining('"status":"denied"')
    );
  });
});
