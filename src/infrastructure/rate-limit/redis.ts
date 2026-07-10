type CheckOptions = {
  windowMs: number;
  max: number;
};

type CheckResult = {
  ok: boolean;
  retryAfter?: number;
};

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export function isRedisRateLimitEnabled(): boolean {
  return Boolean(getRedisConfig());
}

export type RedisHealthStatus = "ok" | "degraded" | "skipped";

export async function checkRedisHealth(): Promise<RedisHealthStatus> {
  const cfg = getRedisConfig();
  if (!cfg) return "skipped";

  try {
    const res = await fetch(`${cfg.url}/ping`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok ? "ok" : "degraded";
  } catch {
    return "degraded";
  }
}

export async function checkRateLimitRedis(
  key: string,
  { windowMs, max }: CheckOptions
): Promise<CheckResult | null> {
  const cfg = getRedisConfig();
  if (!cfg) return null;

  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `cfm:rl:${key}`;

  try {
    const incrRes = await fetch(`${cfg.url}/incr/${encodeURIComponent(redisKey)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
      },
      cache: "no-store",
    });
    if (!incrRes.ok) return null;
    const incrJson = (await incrRes.json()) as { result?: number };
    const count = typeof incrJson.result === "number" ? incrJson.result : 0;

    if (count === 1) {
      await fetch(`${cfg.url}/expire/${encodeURIComponent(redisKey)}/${ttlSeconds}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.token}`,
        },
        cache: "no-store",
      });
    }

    if (count <= max) return { ok: true };

    const ttlRes = await fetch(`${cfg.url}/ttl/${encodeURIComponent(redisKey)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
      },
      cache: "no-store",
    });
    const ttlJson = ttlRes.ok
      ? ((await ttlRes.json()) as { result?: number })
      : { result: 1 };
    const retryAfter = Math.max(1, ttlJson.result || 1);

    return { ok: false, retryAfter };
  } catch {
    return null;
  }
}
