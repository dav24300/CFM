import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { jsonData, jsonError, jsonNotFound, jsonUnauthorized } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { assignMedia } from "@/application/services/media.service";
import { adminMediaAssignSchema } from "@/lib/validators/admin-api";
import { parseOrBadRequest } from "@/lib/validators";

export async function PATCH(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return jsonUnauthorized();

  const body = await request.json();
  const parsed = parseOrBadRequest(adminMediaAssignSchema, body);
  if (!parsed.ok) return parsed.response;

  const { type, id, field, path } = parsed.data;
  const ok = assignMedia({ type, id, field, path });
  if (!ok) return jsonNotFound("Entité introuvable");

  await logAdminAction({
    actorType: access,
    endpoint: "/api/admin/media/assign",
    action: "assign",
    target: `${type}:${id}`,
    status: "success",
    ip: request.headers.get("x-forwarded-for") || null,
    metadata: { field, path },
  });

  return jsonData({ ok: true });
}
