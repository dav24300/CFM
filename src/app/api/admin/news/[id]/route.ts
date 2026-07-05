import { NextRequest } from "next/server";
import { adminDelete, getAdminData } from "@/lib/db";
import { updateStoreAsync } from "@/lib/store";
import { invalidateContentCache } from "@/infrastructure/cache/invalidate";
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
  let found = false;

  await updateStoreAsync((store) => {
    const item = store.news.find((n) => n.id === newsId);
    if (!item) return;
    found = true;
    const patch = parsed.data;
    if (patch.title !== undefined) item.title = patch.title;
    if (patch.content !== undefined) item.content = patch.content;
    if (patch.slug !== undefined) item.slug = patch.slug;
    if (patch.excerpt !== undefined) item.excerpt = patch.excerpt || null;
    if (patch.category !== undefined) item.category = patch.category || "actualite";
    if (patch.cover_image !== undefined) item.cover_image = patch.cover_image || null;
    if (patch.cover_image_alt !== undefined) item.cover_image_alt = patch.cover_image_alt || null;
    if (patch.published !== undefined) item.published = patch.published;
  });

  if (!found) return jsonNotFound("Actualité introuvable");
  invalidateContentCache("news");
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
  try {
    await adminDelete("news", newsId);
    return jsonSuccess();
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}
