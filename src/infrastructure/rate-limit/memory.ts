const hits = new Map<string, { count: number; resetAt: number }>();

type Options = {
  windowMs?: number;
  max?: number;
};

export function checkRateLimit(
  key: string,
  { windowMs = 60_000, max = 60 }: Options = {}
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

export async function checkRateLimitDistributed(
  key: string,
  { windowMs = 60_000, max = 60 }: Options = {}
): Promise<{ ok: boolean; retryAfter?: number }> {
  const { checkRateLimitRedis } = await import("@/infrastructure/rate-limit/redis");
  const redisResult = await checkRateLimitRedis(key, { windowMs, max });
  if (redisResult) return redisResult;
  return checkRateLimit(key, { windowMs, max });
}

export function getClientIp(request: Request): string {
  // x-real-ip est fixé par Vercel (non falsifiable par le client) : source primaire.
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  // Repli x-forwarded-for : prendre le DERNIER hop (ajouté par la plateforme),
  // jamais le premier qui est contrôlé par le client (contournement du rate-limit).
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
}
