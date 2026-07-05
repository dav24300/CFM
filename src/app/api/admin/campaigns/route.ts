import { NextRequest } from "next/server";
import { getAdminData } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminCampaignCreateSchema } from "@/lib/validators/admin-api";
import { jsonData } from "@/lib/api-response";
import { createContentItem } from "@/infrastructure/http/admin-content-handlers";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const { campaigns } = await getAdminData();
  return jsonData({ campaigns });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const parsed = parseOrBadRequest(adminCampaignCreateSchema, await request.json());
  if (!parsed.ok) return parsed.response;
  return createContentItem("campaigns", parsed.data as Record<string, string>);
}
