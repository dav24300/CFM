import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("checkRedisHealth", () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it("returns skipped when Upstash env is missing", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRedisHealth } = await import("@/infrastructure/rate-limit/redis");
    await expect(checkRedisHealth()).resolves.toBe("skipped");
  });

  it("returns ok when Upstash ping succeeds", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    const { checkRedisHealth } = await import("@/infrastructure/rate-limit/redis");
    await expect(checkRedisHealth()).resolves.toBe("ok");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://redis.example.upstash.io/ping",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
      })
    );
  });

  it("returns degraded when Upstash ping fails", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    const { checkRedisHealth } = await import("@/infrastructure/rate-limit/redis");
    await expect(checkRedisHealth()).resolves.toBe("degraded");
  });

  it("returns degraded on network error", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network")) as typeof fetch;

    const { checkRedisHealth } = await import("@/infrastructure/rate-limit/redis");
    await expect(checkRedisHealth()).resolves.toBe("degraded");
  });
});
