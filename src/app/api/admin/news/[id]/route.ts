import { NextRequest } from "next/server";
import { adminDelete, getAdminData } from "@/lib/db";
import { updateNewsItem } from "@/infrastructure/repositories/content.repository";
import { jsonData, jsonError, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { requireAdminAccess } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminNewsPatchSchema } from "@/lib/validators/admin-api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = parseInt(id, 10);
  if (!Number.isFinite(newsId)) return jsonNotFound("Actualité introuvable");
  const { news } = await getAdminData();
  const item = news.find((n) => n.id === newsId);
  if (!item) return jsonNotFound("Actualité introuvable");
  return jsonData({ item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminNewsPatchSchema, body);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const newsId = parseInt(id, 10);
  if (!Number.isFinite(newsId)) return jsonNotFound("Actualité introuvable");
  const found = await updateNewsItem(newsId, parsed.data);

  if (!found) return jsonNotFound("Actualité introuvable");
  return jsonSuccess();
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const newsId = parseInt(id, 10);
  if (!Number.isFinite(newsId)) return jsonNotFound("Actualité introuvable");
  try {
    await adminDelete("news", newsId);
    return jsonSuccess();
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}
