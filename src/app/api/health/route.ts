import { NextResponse } from "next/server";
import { isPgMode, query } from "@/infrastructure/persistence/sql/sql-client";
import { checkRedisHealth } from "@/infrastructure/rate-limit/redis";
import { getMobileMoneyMode } from "@/infrastructure/payment/payment-mode";
import { isSmtpConfigured } from "@/infrastructure/email/nodemailer.adapter";
import { isPusherEnabled } from "@/infrastructure/realtime/pusher.adapter";
import { isVapidConfigured } from "@/infrastructure/push/web-push.adapter";
import { isSupabaseStorageEnabled } from "@/infrastructure/media/supabase-storage.adapter";

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

  // Informatif uniquement (aucun appel externe) : n'influe pas sur `status`.
  const services = {
    payments: getMobileMoneyMode(),
    email: isSmtpConfigured() ? "smtp" : "log-only",
    realtime: isPusherEnabled() ? "pusher" : "polling-only",
    push: isVapidConfigured() ? "vapid" : "log-only",
    storage: isSupabaseStorageEnabled() ? "supabase" : "local",
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
      services,
    },
    { status: healthy ? 200 : 503 }
  );
}
