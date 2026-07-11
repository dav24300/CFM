import { NextResponse } from "next/server";
import { isPgMode, query } from "@/infrastructure/persistence/sql/sql-client";
import { checkRedisHealth } from "@/infrastructure/rate-limit/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "degraded" | "skipped";

async function checkDatabase(): Promise<CheckStatus> {
  if (!isPgMode()) return "skipped";
  try {
    await query("SELECT 1");
    return "ok";
  } catch {
    return "degraded";
  }
}

export async function GET() {
  const checks: Record<string, CheckStatus> = {
    app: "ok",
    database: await checkDatabase(),
    redis: await checkRedisHealth(),
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
