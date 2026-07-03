import { NextRequest } from "next/server";
import { adminCreate, getAdminData } from "@/lib/db";
import { jsonData, jsonError, jsonSuccess } from "@/lib/api-response";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminNewsCreateSchema } from "@/lib/validators/admin-api";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const { news } = getAdminData();
  return jsonData({ news });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminNewsCreateSchema, body);
  if (!parsed.ok) return parsed.response;

  try {
    adminCreate("news", parsed.data as Record<string, string>);
    return jsonSuccess();
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}
