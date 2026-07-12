import { NextRequest } from "next/server";
import { getLiveEvents, updateLiveEvent } from "@/lib/live";
import { requireAdminAccess } from "@/lib/admin-rest";
import { getClientIp } from "@/lib/rate-limit";
import { parseOrBadRequest } from "@/lib/validators";
import { adminLivePatchSchema } from "@/lib/validators/admin-api";
import { jsonData, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  const id = parseInt((await params).id, 10);
  if (!Number.isFinite(id)) return jsonNotFound("Événement introuvable");
  const events = await getLiveEvents();
  const event = events.find((e) => e.id === id);
  if (!event) return jsonNotFound("Événement introuvable");
  return jsonData({ event });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const parsed = parseOrBadRequest(adminLivePatchSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  const id = parseInt((await params).id, 10);
  if (!Number.isFinite(id)) return jsonNotFound("Événement introuvable");
  const event = await updateLiveEvent(id, parsed.data);
  if (!event) return jsonNotFound("Événement introuvable");

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/live/[id]",
    action: "patch",
    target: String(id),
    status: "success",
    ip: getClientIp(request),
  });

  return jsonData({ event });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonSuccess();
}
