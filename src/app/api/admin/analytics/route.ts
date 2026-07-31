import { NextRequest } from "next/server";
import { getCtaCounts } from "@/infrastructure/repositories/analytics.repository";
import { requireAdminRole } from "@/lib/admin-rest";
import { jsonData } from "@/infrastructure/http/api-response";

const ALLOWED_DAYS = [7, 30, 90];

/** Comptes de conversions (clics CTA) par événement sur une fenêtre. Admin-only. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const raw = Number(new URL(request.url).searchParams.get("days"));
  const days = ALLOWED_DAYS.includes(raw) ? raw : 30;

  const counts = await getCtaCounts(days);
  return jsonData({ counts, days });
}
