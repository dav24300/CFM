import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminTestimonialPatchSchema } from "@/lib/validators/admin-api";
import { jsonData, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import {
  applyZodPatch,
  deleteContentItem,
  getContentItem,
  parseContentId,
  patchContentItem,
} from "@/infrastructure/http/admin-content-handlers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const id = parseContentId((await params).id);
  const item = id !== null ? await getContentItem("testimonials", id) : null;
  return jsonData({ item });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const parsed = parseOrBadRequest(adminTestimonialPatchSchema, await request.json());
  if (!parsed.ok) return parsed.response;
  const id = parseContentId((await params).id);
  if (id === null) return jsonNotFound("ID invalide");
  const patch = applyZodPatch(parsed.data);
  if (patch.anonymous !== undefined) patch.anonymous = Number(patch.anonymous) ? 1 : 0;
  return patchContentItem("testimonials", id, patch);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const id = parseContentId((await params).id);
  if (id === null) return jsonNotFound("ID invalide");
  return deleteContentItem("testimonials", id);
}
