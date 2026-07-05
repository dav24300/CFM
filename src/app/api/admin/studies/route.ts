import { NextRequest } from "next/server";
import { getAdminData } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminStudyCreateSchema } from "@/lib/validators/admin-api";
import { jsonData } from "@/lib/api-response";
import { createContentItem } from "@/infrastructure/http/admin-content-handlers";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const { studies } = await getAdminData();
  return jsonData({ studies });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const body = await request.json();
  const parsed = parseOrBadRequest(adminStudyCreateSchema, body);
  if (!parsed.ok) return parsed.response;
  return createContentItem("studies", parsed.data as Record<string, string>);
}
