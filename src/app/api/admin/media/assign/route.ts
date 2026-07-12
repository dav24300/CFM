import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonNotFound, jsonSuccess } from "@/infrastructure/http/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { getClientIp } from "@/infrastructure/rate-limit/memory";
import { assignMedia } from "@/application/services/media.service";
import { adminMediaAssignSchema } from "@/lib/validators/admin-api";
import { parseOrBadRequest } from "@/lib/validators";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminMediaAssignSchema, body);
  if (!parsed.ok) return parsed.response;

  const { type, id, field, path } = parsed.data;
  const ok = assignMedia({ type, id, field, path });
  if (!ok) return jsonNotFound("Entité introuvable");

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/media/assign",
    action: "assign",
    target: `${type}:${id}`,
    status: "success",
    ip: getClientIp(request),
    metadata: { field, path },
  });

  return jsonSuccess();
}
