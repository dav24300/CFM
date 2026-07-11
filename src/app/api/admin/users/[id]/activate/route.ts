import { NextRequest } from "next/server";
import { activateUser, suspendUser } from "@/lib/members";
import { jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminUserActivateSchema } from "@/lib/validators/admin-api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminUserActivateSchema, body);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const userId = parseInt(id, 10);

  if (parsed.data.action === "activate") {
    const user = await activateUser(userId);
    if (!user) return jsonNotFound("Utilisateur introuvable");
    return jsonSuccess();
  }

  await suspendUser(userId);
  return jsonSuccess();
}
