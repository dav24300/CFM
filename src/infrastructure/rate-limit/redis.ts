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
    // INCR + EXPIRE NX + TTL en un seul pipeline (un aller-retour, ordre garanti).
    // EXPIRE NX pose le TTL uniquement s'il manque : évite qu'une coupure entre
    // INCR et EXPIRE laisse une clé sans TTL (bannissement permanent), et évite
    // de prolonger indéfiniment la fenêtre à chaque requête.
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, ttlSeconds, "NX"],
        ["TTL", redisKey],
      ]),
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ result?: number }>;
    if (!Array.isArray(arr) || arr.length < 3) return null;

    const count = typeof arr[0]?.result === "number" ? arr[0].result : 0;
    if (count <= max) return { ok: true };

    const ttl = arr[2]?.result;
    const retryAfter = Math.max(1, typeof ttl === "number" && ttl > 0 ? ttl : ttlSeconds);
    return { ok: false, retryAfter };
  } catch {
    return null;
  }
}
