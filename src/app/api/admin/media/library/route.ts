import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonError, jsonSuccess } from "@/infrastructure/http/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { getClientIp } from "@/infrastructure/rate-limit/memory";
import {
  cleanupOrphanUploads,
  deleteLibraryAsset,
  getMediaLibrary,
  updateLibraryMeta,
} from "@/application/services/media.service";
import { adminMediaLibraryPatchSchema } from "@/lib/validators/admin-api";
import { parseOrBadRequest } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const usagePath = searchParams.get("usage");
  return jsonData(getMediaLibrary(usagePath));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminMediaLibraryPatchSchema, body);
  if (!parsed.ok) return parsed.response;

  updateLibraryMeta(parsed.data.path, {
    alt: parsed.data.alt,
    tags: parsed.data.tags,
    category: parsed.data.category,
  });

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/media/library",
    action: "patch_meta",
    target: parsed.data.path,
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const assetPath = searchParams.get("path");
  if (!assetPath) return jsonError("path requis", 400);

  const result = await deleteLibraryAsset(assetPath);
  if (result.blocked) {
    return jsonError(`Fichier utilisé : ${result.usages.join(", ")}`, 409);
  }

  return jsonSuccess();
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  if (body.action !== "cleanup_orphans") {
    return jsonError("Action inconnue", 400);
  }

  const result = await cleanupOrphanUploads();

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/media/library",
    action: "cleanup_orphans",
    target: String(result.count),
    status: "success",
    ip: getClientIp(request),
  });

  return jsonData(result);
}
