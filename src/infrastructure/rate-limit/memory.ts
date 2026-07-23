const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Repli en mémoire (utilisé quand Upstash n'est pas configuré ou ne répond
 * pas). Les entrées expirées n'étaient jamais supprimées — seulement écrasées
 * si la MÊME clé revenait. La clé étant `ip:route`, un pic d'IP distinctes
 * (campagne virale, botnet) faisait croître la Map sans borne jusqu'à l'OOM.
 * On purge donc périodiquement, avec un plafond dur en dernier recours.
 */
const MAX_ENTRIES = 20_000;
const SWEEP_INTERVAL_MS = 60_000;
let lastSweepAt = 0;

function sweep(now: number): void {
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
  // Toujours saturé après purge (fenêtres encore actives) : on évince les plus
  // anciennes. L'ordre d'itération d'une Map est l'ordre d'insertion.
  if (hits.size > MAX_ENTRIES) {
    let toDrop = hits.size - MAX_ENTRIES;
    for (const key of hits.keys()) {
      hits.delete(key);
      if (--toDrop <= 0) break;
    }
  }
}

type Options = {
  windowMs?: number;
  max?: number;
};

export function checkRateLimit(
  key: string,
  { windowMs = 60_000, max = 60 }: Options = {}
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();

  // Balayage opportuniste : pas de setInterval, qui maintiendrait l'event loop
  // éveillé et empêcherait le gel propre d'une instance serverless.
  if (now - lastSweepAt > SWEEP_INTERVAL_MS || hits.size > MAX_ENTRIES) {
    lastSweepAt = now;
    sweep(now);
  }

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
