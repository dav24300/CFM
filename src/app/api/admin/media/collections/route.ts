import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonError, jsonSuccess } from "@/infrastructure/http/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { getClientIp } from "@/infrastructure/rate-limit/memory";
import {
  getMediaCollections,
  patchMediaCollection,
  removeFikinItem,
  saveMediaCollections,
} from "@/application/services/media.service";
import {
  adminMediaCollectionsPatchSchema,
  adminMediaCollectionsPutSchema,
} from "@/lib/validators/admin-api";
import { parseOrBadRequest } from "@/lib/validators";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonData(await getMediaCollections());
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminMediaCollectionsPutSchema, body);
  if (!parsed.ok) return parsed.response;

  await saveMediaCollections(parsed.data);

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/media/collections",
    action: "put",
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminMediaCollectionsPatchSchema, body);
  if (!parsed.ok) return parsed.response;

  patchMediaCollection(parsed.data);

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/media/collections",
    action: "patch",
    target: parsed.data.type || "collection",
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const sort = Number(searchParams.get("sort"));
  if (!sort) return jsonError("sort requis pour galerie FIKIN", 400);

  removeFikinItem(sort);

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/media/collections",
    action: "delete",
    target: String(sort),
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}
