import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

const ALLOWED_TAGS = new Set(Object.values(CACHE_TAGS));

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];

  if (tags.length === 0) {
    return jsonError("tags requis", 400);
  }

  for (const tag of tags) {
    if (ALLOWED_TAGS.has(tag as (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS])) {
      revalidateTag(tag);
    }
  }

  return jsonSuccess();
}
