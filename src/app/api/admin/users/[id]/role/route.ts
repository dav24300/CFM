import { NextRequest } from "next/server";
import { setUserRole } from "@/infrastructure/repositories/users.repository";
import { jsonNotFound, jsonSuccess } from "@/infrastructure/http/api-response";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminUserRoleSchema } from "@/lib/validators/admin-api";
import { logAdminAction } from "@/lib/admin-audit";
import { getClientIp } from "@/infrastructure/rate-limit/memory";

// Seule voie d'attribution du rôle (member | volunteer | coordinator) :
// l'inscription ne produit jamais de coordinateur.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminUserRoleSchema, body);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (Number.isNaN(userId)) return jsonNotFound("Utilisateur introuvable");

  const user = await setUserRole(userId, parsed.data.role);
  if (!user) return jsonNotFound("Utilisateur introuvable");

  await logAdminAction({
    actorType: auth.access,
    endpoint: `/api/admin/users/${userId}/role`,
    action: `role:${parsed.data.role}`,
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}
