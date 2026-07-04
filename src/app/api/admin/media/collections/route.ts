import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { jsonData, jsonError, jsonSuccess, jsonUnauthorized } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";
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
  if (!(await getAdminAccess())) return jsonUnauthorized();
  return jsonData(getMediaCollections());
}

export async function PUT(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return jsonUnauthorized();

  const body = await request.json();
  const parsed = parseOrBadRequest(adminMediaCollectionsPutSchema, body);
  if (!parsed.ok) return parsed.response;

  saveMediaCollections(parsed.data);

  await logAdminAction({
    actorType: access,
    endpoint: "/api/admin/media/collections",
    action: "put",
    status: "success",
    ip: request.headers.get("x-forwarded-for") || null,
  });

  return jsonSuccess();
}

export async function PATCH(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return jsonUnauthorized();

  const body = await request.json();
  const parsed = parseOrBadRequest(adminMediaCollectionsPatchSchema, body);
  if (!parsed.ok) return parsed.response;

  patchMediaCollection(parsed.data);

  await logAdminAction({
    actorType: access,
    endpoint: "/api/admin/media/collections",
    action: "patch",
    target: parsed.data.type || "collection",
    status: "success",
    ip: request.headers.get("x-forwarded-for") || null,
  });

  return jsonSuccess();
}

export async function DELETE(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const sort = Number(searchParams.get("sort"));
  if (!sort) return jsonError("sort requis pour galerie FIKIN", 400);

  removeFikinItem(sort);

  await logAdminAction({
    actorType: access,
    endpoint: "/api/admin/media/collections",
    action: "delete",
    target: String(sort),
    status: "success",
    ip: request.headers.get("x-forwarded-for") || null,
  });

  return jsonSuccess();
}
