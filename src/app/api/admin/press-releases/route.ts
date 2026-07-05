import { NextRequest } from "next/server";
import { getAdminData } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminPressCreateSchema } from "@/lib/validators/admin-api";
import { jsonData } from "@/lib/api-response";
import { createContentItem } from "@/infrastructure/http/admin-content-handlers";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const { press_releases } = await getAdminData();
  return jsonData({ press_releases });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const parsed = parseOrBadRequest(adminPressCreateSchema, await request.json());
  if (!parsed.ok) return parsed.response;
  return createContentItem("press_releases", parsed.data as Record<string, string>);
}
