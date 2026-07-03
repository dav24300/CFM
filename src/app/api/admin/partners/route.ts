import { NextRequest } from "next/server";
import {
  getAllPartners,
  adminCreatePartner,
  adminUpdatePartner,
  adminDeletePartner,
} from "@/infrastructure/repositories/partners.repository";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonData({ partners: getAllPartners() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const partner = adminCreatePartner({
    name: String(body.name || ""),
    logo_url: body.logo_url,
    website: body.website,
    description: body.description,
    sort_order: body.sort_order,
  });

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/partners",
    action: "create",
    target: String(partner.id),
    status: "success",
    ip: request.headers.get("x-forwarded-for"),
  });

  return jsonData({ partner });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const id = Number(body.id);
  if (!id) return jsonNotFound("ID requis");

  const ok = adminUpdatePartner(id, {
    name: body.name,
    logo_url: body.logo_url,
    website: body.website,
    description: body.description,
    sort_order: body.sort_order,
  });
  if (!ok) return jsonNotFound("Partenaire introuvable");

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/partners",
    action: "patch",
    target: String(id),
    status: "success",
    ip: request.headers.get("x-forwarded-for"),
  });

  return jsonSuccess();
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return jsonNotFound("ID requis");

  adminDeletePartner(id);

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/partners",
    action: "delete",
    target: String(id),
    status: "success",
    ip: request.headers.get("x-forwarded-for"),
  });

  return jsonSuccess();
}
