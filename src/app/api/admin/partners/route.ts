import { NextRequest } from "next/server";
import {
  getAllPartners,
  adminCreatePartner,
  adminUpdatePartner,
  adminDeletePartner,
} from "@/infrastructure/repositories/partners.repository";
import { requireAdminAccess } from "@/lib/admin-rest";
import { getClientIp } from "@/lib/rate-limit";
import { jsonData, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { parseOrBadRequest } from "@/lib/validators";
import {
  adminPartnerCreateSchema,
  adminPartnerPatchSchema,
} from "@/lib/validators/admin-api";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonData({ partners: await getAllPartners() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const parsed = parseOrBadRequest(
    adminPartnerCreateSchema,
    await request.json().catch(() => null)
  );
  if (!parsed.ok) return parsed.response;

  // null ⇒ undefined : le repository applique déjà `|| null` / `?? défaut`.
  const partner = await adminCreatePartner({
    name: parsed.data.name,
    logo_url: parsed.data.logo_url ?? undefined,
    website: parsed.data.website ?? undefined,
    description: parsed.data.description ?? undefined,
    sort_order: parsed.data.sort_order ?? undefined,
  });

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/partners",
    action: "create",
    target: String(partner.id),
    status: "success",
    ip: getClientIp(request),
  });

  return jsonData({ partner });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const parsed = parseOrBadRequest(
    adminPartnerPatchSchema,
    await request.json().catch(() => null)
  );
  if (!parsed.ok) return parsed.response;

  const id = Number(parsed.data.id);
  if (!id) return jsonNotFound("ID requis");

  const ok = await adminUpdatePartner(id, {
    name: parsed.data.name,
    logo_url: parsed.data.logo_url,
    website: parsed.data.website,
    description: parsed.data.description,
    sort_order: parsed.data.sort_order ?? undefined,
  });
  if (!ok) return jsonNotFound("Partenaire introuvable");

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/partners",
    action: "patch",
    target: String(id),
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return jsonNotFound("ID requis");

  await adminDeletePartner(id);

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/partners",
    action: "delete",
    target: String(id),
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}
