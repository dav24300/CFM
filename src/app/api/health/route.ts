import { NextResponse } from "next/server";
import { isPostgresEnabled } from "@/infrastructure/persistence/db-adapter";
import { isRedisRateLimitEnabled } from "@/infrastructure/rate-limit/redis";
import { bootstrapPostgresStore } from "@/infrastructure/persistence/postgres-store.adapter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "degraded" | "skipped";

async function checkDatabase(): Promise<CheckStatus> {
  if (!isPostgresEnabled()) return "skipped";
  try {
    const hydrated = await bootstrapPostgresStore();
    return hydrated ? "ok" : "degraded";
  } catch {
    return "degraded";
  }
}

export async function GET() {
  const checks: Record<string, CheckStatus> = {
    app: "ok",
    database: await checkDatabase(),
    redis: isRedisRateLimitEnabled() ? "ok" : "skipped",
  };

  const healthy =
    checks.app === "ok" &&
    (checks.database === "ok" || checks.database === "skipped");

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      version: process.env.npm_package_version ?? "1.0.0",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
